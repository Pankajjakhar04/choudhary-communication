import React from 'react'

export default function SkeletonCard(){
  return (
    <div className="animate-pulse bg-white rounded-xl p-3">
      <div className="bg-gray-200 h-36 rounded" />
      <div className="h-3 bg-gray-200 rounded mt-3 w-3/4" />
      <div className="h-3 bg-gray-200 rounded mt-2 w-1/4" />
    </div>
  )
}
