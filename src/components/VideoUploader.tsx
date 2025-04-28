"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/services/api";
import toast from "react-hot-toast";

// API base URL for backend server
const API_BASE_URL = 'http://localhost:3001';

type VideoUploaderProps = {
  playerId: string;
};

export default function VideoUploader({ playerId }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<{
    size?: number;
    type?: string;
  } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Convert relative paths to absolute URLs
  const getFullVideoUrl = (relativePath: string | null): string | null => {
    if (!relativePath) return null;
    
    // If it's already an absolute URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // Otherwise, prepend the API base URL
    return `${API_BASE_URL}${relativePath}`;
  };

  // Fetch existing video on component mount
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const videos = await api.getPlayerVideos(playerId);
        if (videos && videos.length > 0) {
          const video = videos[0];
          setVideoUrl(video?.url || null);
          setVideoDetails({
            size: video?.size,
            type: video?.type
          });
        }
      } catch (error) {
        console.error("Error fetching video:", error);
        setVideoError("Could not load existing video information.");
      }
    };

    fetchVideo();
  }, [playerId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only video files are allowed.");
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 500MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setVideoError(null);

    try {
      toast.loading("Uploading video...", { id: "upload" });

      const response = await api.uploadVideo(playerId, file, (uploadProgress) => {
        setProgress(uploadProgress);
      });

      setVideoUrl(response.url);
      setVideoDetails({
        size: response.size,
        type: response.mimeType
      });

      toast.success("Video uploaded successfully!", { id: "upload" });
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video. Please try again.", { id: "upload" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleVideoError = () => {
    console.error("Video failed to load:", videoUrl);
    setVideoError("Failed to load video. The file might be corrupted or inaccessible.");
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const fullVideoUrl = getFullVideoUrl(videoUrl);

  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold">Player Videos</h3>
      
      {/* Video player */}
      {fullVideoUrl && (
        <div className="mb-4">
          {videoError ? (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
              <p className="font-medium">Video Error</p>
              <p>{videoError}</p>
              <p className="mt-2 text-sm">URL: {fullVideoUrl}</p>
            </div>
          ) : (
            <video 
              ref={videoRef}
              controls 
              preload="metadata"
              className="mb-2 w-full rounded-lg"
              src={fullVideoUrl}
              onError={handleVideoError}
            >
              Your browser does not support the video tag.
            </video>
          )}
          <div className="text-sm text-gray-600">
            {videoDetails?.type && <p>Type: {videoDetails.type}</p>}
            {videoDetails?.size && <p>Size: {formatFileSize(videoDetails.size)}</p>}
          </div>
        </div>
      )}
      
      {/* Upload section */}
      <div className="mt-4">
        {uploading ? (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <label className="mb-2 block text-sm font-medium">
              {videoUrl ? "Replace video" : "Upload a video"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              MP4, MOV, AVI, or WebM (max. 500MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 