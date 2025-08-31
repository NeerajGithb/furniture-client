"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ImageData {
  url: string;
  alt?: string;
}

interface ProductImageGalleryProps {
  images: ImageData[];
  productName: string;
}

const ProductImageGallery = ({
  images,
  productName,
}: ProductImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentImage = images[selectedImageIndex];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZooming) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mouseXPercent = Math.max(10, Math.min((mouseX / rect.width) * 100, 90));
    const mouseYPercent = Math.max(10, Math.min((mouseY / rect.height) * 100, 90));
    setMousePosition({ x: mouseXPercent, y: mouseYPercent });
  };

  const handleShare = () => {
    if (currentImage?.url) {
      navigator.clipboard.writeText(currentImage.url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  if (!images.length) {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center max-w-md border border-gray-200">
        <span className="text-gray-400 text-sm">No Image Available</span>
      </div>
    );
  }

  return (
    <>
      {/* Full Screen Zoom Overlay */}
      {isZooming && currentImage && (
        <div className="fixed inset-0 z-20 pointer-events-none hidden lg:block">
          <div
            className="absolute left-1/2 top-0 bottom-0 right-10  border-l border-gray-300 shadow-2xl bg-white transition-all duration-300 ease-out"
            style={{
              backgroundImage: `url(${currentImage.url})`,
              backgroundSize: "200% 200%",
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundRepeat: "no-repeat",
              filter: "contrast(1.05) brightness(1.02)",
            }}
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row border border-gray-300 overflow-hidden max-w-[550px]">
        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2 order-2 md:order-1 flex-wrap md:flex-nowrap border-t md:border-t-0 md:border-r border-gray-300 p-2 md:p-0 overflow-y-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onMouseEnter={() => setSelectedImageIndex(index)}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 border border-gray-200 hover:border-gray-400 ${
                  selectedImageIndex === index ? "border-2 border-black" : ""
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt || `${productName} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="flex-1 order-1 md:order-2 p-2  flex items-center justify-center border-l md:border-l-0 border-t md:border-t-0 border-gray-300">
          <div
            className="relative bg-white group overflow-hidden aspect-square cursor-none transition-all duration-300 border border-gray-200"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt || productName}
              className="w-full h-full object-cover object-center"
            />

            {isZooming && (
              <div
                className="absolute hidden lg:block border border-gray-400"
                style={{
                  left: `${mousePosition.x}%`,
                  top: `${mousePosition.y}%`,
                  width: "20%",
                  height: "20%",
                  backgroundColor: "rgba(255,255,255,0.3)",
                  pointerEvents: "none",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Crosshair */}
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "20px",
                    height: "20px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "0",
                      width: "2px",
                      height: "20px",
                      backgroundColor: "rgba(0,0,0,0.8)",
                      transform: "translateX(-50%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "0",
                      height: "2px",
                      width: "20px",
                      backgroundColor: "rgba(0,0,0,0.8)",
                      transform: "translateY(-50%)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="absolute top-3 right-3 p-2 bg-white bg-opacity-95 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 hover:scale-110 border border-gray-200 rounded"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductImageGallery;
