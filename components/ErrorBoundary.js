import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    maxWidth: 600,
                    margin: '80px auto',
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e9ecef',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                    <h2 style={{ color: '#FF6B6B', fontFamily: "'Poppins', sans-serif" }}>
                        Bir hata oluştu
                    </h2>
                    <p style={{ color: '#666', marginBottom: 20 }}>
                        Hesaplama sırasında beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            if (typeof window !== 'undefined') window.location.reload();
                        }}
                        style={{
                            background: '#00539C',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 15,
                        }}
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
