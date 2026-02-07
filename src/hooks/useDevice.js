import { useState, useEffect } from 'react';

export const useDevice = () => {
    const [device, setDevice] = useState({
        isMobile: false,
        isTablet: false,
        isLaptop: false,
        isDesktop: false,
        width: typeof window !== 'undefined' ? window.innerWidth : 0
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setDevice({
                isMobile: width < 640,
                isTablet: width >= 640 && width < 1024,
                isLaptop: width >= 1024 && width < 1280,
                isDesktop: width >= 1280,
                width
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return device;
};
