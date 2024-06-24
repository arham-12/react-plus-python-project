import React, { useState } from "react";
import axios from "axios";
import { AiOutlineUpload } from "react-icons/ai";

const UploadFile = ({ setUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return console.log("please enter file");
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // setUploadSuccess(true);
      alert(response.data.message);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-64 bg-zinc-950 p-4 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col items-center justify-center`}>
        <h1 className="text-3xl text-center font-bold text-blue-700 mb-4">
          Upload Document
        </h1>
        <p className="text-center mb-2">Upload PDF file for chat!</p>
        <div className="flex flex-col items-center gap-4 w-full">
          <label
            className="bg-gray-700 hover:bg-blue-700  cursor-pointer text-white font-semibold py-2 px-6 rounded-md w-full text-center"
            htmlFor="input-file"
          >
            Choose File
          </label>
          <input
            onChange={handleFileChange}
            className="hidden"
            id="input-file"
            type="file"
            accept=".pdf"
          />
          <button
            onClick={handleUpload}
            className="bg-gray-700 hover:bg-blue-700 cursor-pointer text-white font-semibold py-2 px-6 rounded-md w-full"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </div>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white text-3xl"
        >
          <AiOutlineUpload />
        </button>
      </div>
    </>
  );
};

export default UploadFile;
