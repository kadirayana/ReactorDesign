import React from 'react';

export default function TabButton({ active, onClick, children }) {
    return (
        <button
            style={{
                background: active ? '#00539C' : 'transparent',
                color: active ? 'white' : '#666',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: '0',
                marginRight: 0,
                fontWeight: active ? '600' : '500',
                transition: '0.3s',
                borderBottom: active ? '3px solid #00539C' : '3px solid transparent',
                minHeight: 'auto',
                transform: 'none',
            }}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
