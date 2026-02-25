import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
            transition={{
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] // Snappy but smooth "Glass Slide" feel
            }}
            style={{
                width: '100%',
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
