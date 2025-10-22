import React, { useState, useCallback } from 'react';
import { ImageFile } from './types';
import { editImageWithPrompt, fileToBase64 } from './services/geminiService';
import { UploadIcon, SparklesIcon, XCircleIcon, PhotoIcon, CubeTransparentIcon } from './components/Icons';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGeneratedImage(null);
      setError(null);
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage({ file, base64 });
      } catch (err) {
        setError("Failed to read image file.");
        setOriginalImage(null);
      }
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError("Please upload an image and provide a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const newImageBase64 = await editImageWithPrompt(
        originalImage.base64,
        originalImage.file.type,
        prompt
      );
      setGeneratedImage(`data:${originalImage.file.type};base64,${newImageBase64}`);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const clearImage = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setError(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="container mx-auto w-full max-w-6xl">
        <header className="text-center mb-8">
            <div className="inline-flex items-center gap-3">
                <SparklesIcon className="w-10 h-10 text-purple-400" />
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Gemini Image Editor
                </h1>
            </div>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Upload an image, describe your desired changes, and watch Gemini 2.5 Flash bring your vision to life.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg">
            <div>
                <h2 className="text-xl font-semibold mb-3 text-purple-300">1. Upload Image</h2>
                <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors">
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isLoading}
                    />
                    {originalImage ? (
                        <div className="relative group">
                            <img src={`data:${originalImage.file.type};base64,${originalImage.base64}`} alt="Original preview" className="mx-auto max-h-60 rounded-md shadow-md" />
                            <button
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1.5 bg-gray-900/70 rounded-full text-white hover:bg-red-600/80 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 h-full py-10">
                           <UploadIcon className="w-12 h-12 mb-2"/>
                           <p className="font-semibold">Click to upload or drag & drop</p>
                           <p className="text-sm">PNG, JPG, or WEBP</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3 text-purple-300">2. Describe Your Edit</h2>
                <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Add a retro filter', 'Make the sky look like a galaxy', 'Remove the person in the background'"
                className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-200 placeholder-gray-500 disabled:opacity-50"
                disabled={!originalImage || isLoading}
                />
            </div>
            
            <button
              onClick={handleGenerateClick}
              disabled={!originalImage || !prompt || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <CubeTransparentIcon className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>
            {error && <div className="mt-2 text-center text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</div>}
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg items-center justify-center min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4 text-purple-300 self-start">3. Result</h2>
             <div className="w-full h-full flex items-center justify-center">
                {isLoading ? (
                    <div className="text-center text-gray-400">
                        <CubeTransparentIcon className="w-16 h-16 animate-spin text-purple-400 mx-auto" />
                        <p className="mt-4 text-lg">Generating your masterpiece...</p>
                        <p className="text-sm text-gray-500">This may take a moment.</p>
                    </div>
                ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="max-w-full max-h-[500px] rounded-lg shadow-2xl object-contain"/>
                ) : (
                     <div className="text-center text-gray-500">
                        <PhotoIcon className="w-20 h-20 mx-auto mb-4"/>
                        <p className="text-lg font-medium">Your generated image will appear here.</p>
                        <p className="text-sm">Follow the steps on the left to start.</p>
                    </div>
                )}
             </div>
          </div>
        </div>
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by Google Gemini 2.5 Flash Image. For creative purposes only.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;