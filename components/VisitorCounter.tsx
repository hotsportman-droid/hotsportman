
import React, { useEffect, useRef } from 'react';

const VisitorCounter: React.FC = () => {
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = counterRef.current;
    if (!container) return;

    // Prevent script duplication in React's StrictMode which runs useEffect twice in development
    if (container.dataset.scriptLoaded) {
      return;
    }
    container.dataset.scriptLoaded = 'true';

    // The counter service provides two scripts. 
    // The first is for authentication, the second displays the counter.
    // They must be loaded in sequence for the counter to display correctly.

    const authScript = document.createElement('script');
    authScript.type = 'text/javascript';
    authScript.src = 'https://www.freevisitorcounters.com/auth.php?id=b8493262e998d0416d6ff20e918d4170e733f287';
    authScript.async = true;
    
    const counterScript = document.createElement('script');
    counterScript.type = 'text/javascript';
    counterScript.src = 'https://www.freevisitorcounters.com/en/home/counter/1445051/t/3';
    counterScript.async = true;

    // Create a hidden link as required by the service's terms of use
    const link = document.createElement('a');
    link.href = 'https://www.counters-free.net/';
    link.title = 'Visitor Counters free';
    link.style.display = 'none';
    container.appendChild(link);

    // Append scripts sequentially to ensure the authentication script runs before the display script
    container.appendChild(authScript);
    authScript.onload = () => {
      container.appendChild(counterScript);
    };

  }, []);

  // This span acts as a container where the external script will render its output.
  return <span ref={counterRef} className="inline-block align-middle h-[20px] w-[100px]"></span>;
};

export default VisitorCounter;
