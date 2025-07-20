// Animation variants for page transitions
export const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Staggered animation for children elements
export const staggerContainer = (staggerChildren: number, delayChildren: number = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

// Animation for navigation items
export const navItemAnimation = {
  hidden: { opacity: 0, y: -10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Animation for scale transitions
export const scaleAnimation = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Fade-in animation
export const fadeIn = (direction: 'up' | 'down' | 'left' | 'right', delay: number = 0) => {
  return {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0
    },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        type: "tween",
        duration: 0.8,
        delay,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }
  };
};

// Animation for cards
export const cardAnimation = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.03,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3
    }
  }
};

// Rotating animation
export const rotateAnimation = {
  hidden: { opacity: 0, rotate: -45 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Simple hover scale animation
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.3 }
}; 