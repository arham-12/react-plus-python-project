import React, { useState } from "react";
import { RiRobot2Fill } from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import axios from "axios";

const QueryDocument = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatList, setChatList] = useState([]);

  const handleQuery = async () => {
    if (!query) return;
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/query', { user_question: query });
      const newChat = {
        request: query,
        response: res.data.response
      };
      setChatList([...chatList, newChat]);
      setQuery('');
    } catch (error) {
      console.error('Error querying document:', error);
      alert('upload PDF first');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col mx-auto p-2 md:w-3/4 lg:w-2/3">
      <ul className="chatbox flex-1 p-5 bg-black rounded-md overflow-auto">
        {chatList.length > 0 ? (
          chatList.map((chat, index) => (
            <div key={index} className="mb-4">
              <div className="send flex justify-end">
                <div className="flex items-end max-w-full md:max-w-3/4">
                  <div className="chat-bubble bg-blue-700 text-white p-3 rounded-lg shadow-md">
                    {chat.request}
                  </div>
                  <FaRegUserCircle className="text-3xl ml-2" />
                </div>
              </div>
              <div className="response flex justify-start mt-2">
                <div className="flex items-start max-w-full md:max-w-3/4">
                  <RiRobot2Fill className="text-3xl mr-2" />
                  <div className="chat-bubble bg-gray-700 text-white p-3 rounded-lg shadow-md">
                    {chat.response}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center text-xl md:text-2xl lg:text-4xl h-full gap-2 text-white">
            <strong>Welcome</strong> to chat with your document!
          </div>
        )}
      </ul>
      <div className="input-field h-20 flex items-center justify-between gap-2 bg-black p-2">
        <input
          className="flex-grow bg-black outline-none border-2 border-gray-700 px-2 py-1 rounded-md text-white focus:border-blue-700"
          type="text"
          placeholder="Ask Question From Dcoument"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
        />
        <button
          onClick={handleQuery}
          className="ml-2 px-4 py-1 text-lg font-semibold rounded-md bg-gray-700  hover:bg-blue-700 flex items-center justify-center text-white"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'} <IoMdSend className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default QueryDocument;
