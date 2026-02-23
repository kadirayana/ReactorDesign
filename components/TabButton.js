import React from 'react';

export default function TabButton({ active, onClick, children }) {
    return (
        <button
            className={active ? 'active' : ''}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
