import os
import uvicorn
import dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables from .env file
dotenv.load_dotenv()

# Retrieve API key from environment variables
api_key = os.getenv("GROQ_API_KEY")

# Check if API key is available
if api_key:
    print("API Key found")
else:
    raise Exception("API Key not found")

# Initialize the language model with API key
llm = ChatGroq(temperature=0.5, model="llama3-70b-8192", api_key=api_key)

# Create a FastAPI instance
app = FastAPI()

# CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all HTTP headers
)

# Global variable to store vectorstore
vectorstore = None

# Pydantic model for handling query requests
class QueryRequest(BaseModel):
    user_question: str

# Endpoint to upload and process the file
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        global vectorstore
        file_path = f"temp_{file.filename}"
        
        # Save the uploaded file temporarily
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Load and split the PDF file into pages
        loader = PyPDFLoader(file_path)
        pages = loader.load_and_split()
        
        # Get text chunks from the pages
        text_chunks = get_chunks(pages)
        
        # Create a vectorstore from the text chunks
        vectorstore = get_vectorstore(text_chunks)
        
        # Remove the temporary file
        os.remove(file_path)
        
        return {"message": "you are ready for chat!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to handle user queries
@app.post("/query")
async def query_document(query: QueryRequest):
    try:
        # Check if vectorstore is created
        if vectorstore is None:
            raise HTTPException(status_code=400, detail="Vectorstore not created. Upload a file first.")
        
        user_question = query.user_question
        
        # Handle user input and get the response
        response_content = handle_user_input(user_question)
        
        return {"response": response_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Function to split documents into smaller chunks
def get_chunks(pages):
    text_splitter = CharacterTextSplitter(
        chunk_size=900,
        chunk_overlap=100,
    )
    chunks = text_splitter.split_documents(pages)
    return chunks

# Function to create a vectorstore from the text chunks
def get_vectorstore(pages):
    embeddings = HuggingFaceEmbeddings()
    embeddings.model_name = "sentence-transformers/all-mpnet-base-v2"
    documents = [Document(page_content=page.page_content, metadata=page.metadata) for page in pages]
    db = FAISS.from_documents(documents, embeddings)
    return db

# Function to handle user input and generate response using the language model
def handle_user_input(user_question):
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 2})
    
    # Retrieve context documents similar to the user question
    context_documents = retriever.invoke(user_question)
    formatted_context = "\n".join([doc.page_content for doc in context_documents])
    
    # Message template for the language model
    message_template = """
    Answer this question using the provided context only.
    
    Question:
    {user_question}
    
    File content:
    {formatted_context}
    If the question is not relevant to the file content then 
    tell the user to please ask relevant questions to your document.
    """
    
    # Format the user question and context into the prompt
    prompt = ChatPromptTemplate.from_messages([("human", message_template)])
    user_question_with_context = prompt.format(user_question=user_question, formatted_context=formatted_context)
    
    # Invoke the language model to get the response
    response = llm.invoke(user_question_with_context)
    return response.content

# Run the FastAPI application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
