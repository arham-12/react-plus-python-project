import React from 'react'
import QueryDocument from './Components/Chat'
import UploadFile from './Components/UploadFile'

const App = () => {
  return (
    <div className='flex min-w-full min-h-full justify-between'>
      <UploadFile/>
      <QueryDocument/>
    </div>
  )
}

export default App