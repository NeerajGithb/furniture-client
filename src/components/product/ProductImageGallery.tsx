'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageData {
  url: string;
  alt?: string;
}

interface ProductImageGalleryProps {
  images: ImageData[];
  productName: string;
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [actualIndex, setActualIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [copied, setCopied] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentImage = images[selectedImageIndex];

  useEffect(() => {
    if (!isTransitioning) return;

    const timer = setTimeout(() => {
      setIsTransitioning(false);

      if (actualIndex === 0) {
        setActualIndex(images.length);
      } else if (actualIndex === images.length + 1) {
        setActualIndex(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [actualIndex, isTransitioning, images.length]);

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

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const newActualIndex = actualIndex - 1;
    setActualIndex(newActualIndex);

    const newSelectedIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(newSelectedIndex);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const newActualIndex = actualIndex + 1;
    setActualIndex(newActualIndex);

    const newSelectedIndex = (selectedImageIndex + 1) % images.length;
    setSelectedImageIndex(newSelectedIndex);
  };

  const handleThumbnailClick = (index: number) => {
    if (isTransitioning) return;
    setSelectedImageIndex(index);
    setActualIndex(index + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
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
      <div className="">
        {isZooming && currentImage && (
          <div className="fixed inset-0 z-[1000] pointer-events-none hidden lg:block">
            <div
              className="border border-gray-300 shadow-2xl bg-white transition-all duration-300 ease-out"
              style={{
                width: '700px',
                height: '700px',
                position: 'fixed',
                top: '60px',
                right: '5vw',
                backgroundImage: `url(${currentImage.url})`,
                backgroundSize: '170% 170%',
                backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                backgroundRepeat: 'no-repeat',
                filter: 'contrast(1.05) brightness(1.02)',
              }}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row border border-gray-300 overflow-hidden max-w-[600px] md:p-2">
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 order-2 md:order-1 flex-wrap md:flex-nowrap border-t md:border-t-0 md:border-r border-gray-300 p-2 md:p-0 overflow-y-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onMouseEnter={() => handleThumbnailClick(index)}
                  onClick={() => handleThumbnailClick(index)}
                  className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 border md:border-gray-200 hover:border-gray-400 transition-colors ${
                    selectedImageIndex === index ? 'border-2 border-black' : ''
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

          {/* Main Image Carousel */}
          <div className="flex-1 order-1 md:order-2 md:pl-2 flex items-center justify-center border-l md:border-l-0 border-t md:border-t-0 border-gray-300">
            <div className="relative h-full w-full">
              <div
                className="relative bg-white group overflow-hidden aspect-square cursor-crosshair md:border md:border-gray-200"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Mobile Carousel */}
                <div
                  className="md:hidden flex h-full"
                  style={{
                    transform: `translateX(-${actualIndex * 100}%)`,
                    transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
                  }}
                >
                  {/* Last image clone (for smooth previous transition) */}
                  <img
                    src={images[images.length - 1].url}
                    alt={images[images.length - 1].alt || `${productName} ${images.length}`}
                    className="w-full h-full object-cover object-center flex-shrink-0"
                  />
                  {/* Real images */}
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.alt || `${productName} ${index + 1}`}
                      className="w-full h-full object-cover object-center flex-shrink-0"
                    />
                  ))}
                  {/* First image clone (for smooth next transition) */}
                  <img
                    src={images[0].url}
                    alt={images[0].alt || `${productName} 1`}
                    className="w-full h-full object-cover object-center flex-shrink-0"
                  />
                </div>

                {/* Desktop Single Image */}
                <div className="hidden md:block h-full">
                  <img
                    src={currentImage.url}
                    alt={currentImage.alt || productName}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {isZooming && (
                  <div
                    className="absolute hidden lg:block border border-gray-400 z-10 m-2"
                    style={{
                      left: `${mousePosition.x}%`,
                      top: `${mousePosition.y}%`,
                      width: '35%',
                      height: '35%',
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      pointerEvents: 'none',
                      transform: 'translate(-50%, -50%)',
                    }}
                  ></div>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="absolute top-3 right-3 p-2 bg-white bg-opacity-95 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 hover:scale-110 border border-gray-200 z-10"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Share2 className="w-4 h-4 text-gray-700" />
                  )}
                </button>
              </div>

              {/* Navigation Buttons - Mobile Only */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 bg-white bg-opacity-90 shadow-md border border-gray-200 hover:bg-gray-50 md:hidden z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 bg-white bg-opacity-90 shadow-md border border-gray-200 hover:bg-gray-50 md:hidden z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ProductImageGallery;
