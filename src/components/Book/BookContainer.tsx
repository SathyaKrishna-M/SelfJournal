import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button';

interface BookContainerProps {
    children: React.ReactNode;
}

export default function BookContainer({ children }: BookContainerProps) {
    const pages = React.Children.toArray(children);
    // 0 = Showing Page 0 & 1 (Index 0, 1)
    const [currentIndex, setCurrentIndex] = useState(0);

    // Responsive: Single page on mobile, Double on desktop
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const showLeft = currentIndex;
    const showRight = currentIndex + 1;

    const goNext = () => {
        if (isMobile) {
            if (currentIndex + 1 < pages.length) setCurrentIndex(p => p + 1);
        } else {
            if (currentIndex + 2 < pages.length) setCurrentIndex(p => p + 2);
        }
    };

    const goPrev = () => {
        if (isMobile) {
            if (currentIndex > 0) setCurrentIndex(p => p - 1);
        } else {
            if (currentIndex > 0) setCurrentIndex(p => p - 2);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 lg:p-12 transition-all duration-500">

            {/* Book Case / Leather Binding */}
            <div className="relative w-full max-w-[1600px] h-full max-h-[95vh] aspect-[16/10] bg-[#2c241b] rounded-xl shadow-book flex overflow-hidden border border-[#3e3428]">

                {/* Mobile Single Page View */}
                {isMobile ? (
                    <div className="w-full h-full bg-paper dark:bg-dark-paper relative overflow-hidden transition-colors duration-500">
                        <div className="absolute inset-0 bg-paper-texture opacity-50 pointer-events-none mix-blend-multiply dark:mix-blend-soft-light" />
                        <div className="h-full w-full overflow-y-auto">
                            {pages[currentIndex]}
                        </div>
                        {/* Mobile Nav Overlay */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 pointer-events-none">
                            <Button
                                onClick={goPrev}
                                disabled={currentIndex === 0}
                                variant="secondary"
                                size="icon"
                                className="pointer-events-auto shadow-md rounded-full"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <span className="bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full text-xs font-serif shadow-sm backdrop-blur-sm self-center text-stone-800 dark:text-dark-text">
                                {currentIndex + 1} / {pages.length}
                            </span>
                            <Button
                                onClick={goNext}
                                disabled={currentIndex >= pages.length - 1}
                                variant="secondary"
                                size="icon"
                                className="pointer-events-auto shadow-md rounded-full"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Desktop Dual Page View */
                    <div className="w-full h-full flex relative">
                        {/* Book Spine Center Effect */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-24 -ml-12 bg-spine-gradient z-20 pointer-events-none mix-blend-multiply dark:mix-blend-soft-light opacity-60" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#000000]/10 dark:bg-[#ffffff]/10 z-20" />

                        {/* Left Page */}
                        <div className="flex-1 relative bg-paper dark:bg-dark-paper h-full overflow-hidden transition-all duration-300">
                            <div className="absolute inset-0 bg-paper-texture opacity-60 pointer-events-none mix-blend-multiply dark:mix-blend-soft-light" />
                            {/* Left Page Shadow */}
                            <div className="absolute inset-0 shadow-page-left pointer-events-none z-10" />

                            <div key={`left-${showLeft}`} className="h-full w-full overflow-y-auto custom-scrollbar animate-fade-in">
                                {pages[showLeft]}
                            </div>

                            {/* Page Number */}
                            <div className="absolute bottom-6 left-10 text-stone-400 dark:text-stone-600 font-serif text-sm z-30">
                                {showLeft + 1}
                            </div>
                        </div>

                        {/* Right Page */}
                        <div className="flex-1 relative bg-paper dark:bg-dark-paper h-full overflow-hidden transition-all duration-300">
                            <div className="absolute inset-0 bg-paper-texture opacity-60 pointer-events-none mix-blend-multiply dark:mix-blend-soft-light" />
                            {/* Right Page Shadow */}
                            <div className="absolute inset-0 shadow-page-right pointer-events-none z-10" />

                            <div key={`right-${showRight}`} className="h-full w-full overflow-y-auto custom-scrollbar animate-fade-in">
                                {pages[showRight]}
                            </div>

                            {/* Page Number */}
                            <div className="absolute bottom-6 right-10 text-stone-400 dark:text-stone-600 font-serif text-sm z-30">
                                {showRight < pages.length ? showRight + 1 : ''}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
