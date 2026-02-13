import { SignUpForm, LoginForm } from '../components/auth';

/**
 * Authentication Forms Showcase
 * 
 * This page demonstrates both authentication forms side by side
 * Useful for testing and development
 * 
 * Access at: /auth-showcase
 */
export default function AuthShowcase() {
    return (
        <div className="min-h-screen px-4 py-12">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-charcoal mb-4">
                        Authentication Forms Showcase
                    </h1>
                    <p className="text-mid-gray max-w-2xl mx-auto">
                        Below are the sign-up and login forms with full validation, 
                        sanitization, and user feedback. Test them to see error handling 
                        and success states.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div>
                        <h2 className="text-2xl font-bold text-charcoal mb-6 text-center">
                            Sign Up Form
                        </h2>
                        <SignUpForm />
                        
                        <div className="mt-6 p-4 bg-white/60 rounded-lg">
                            <h3 className="font-semibold text-charcoal mb-2">Features:</h3>
                            <ul className="text-sm text-mid-gray space-y-1">
                                <li>✓ Input sanitization (XSS protection)</li>
                                <li>✓ Email format validation</li>
                                <li>✓ Password strength check (min 6 chars)</li>
                                <li>✓ Password confirmation matching</li>
                                <li>✓ Optional display name</li>
                                <li>✓ Real-time validation feedback</li>
                                <li>✓ Success message with redirect</li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-charcoal mb-6 text-center">
                            Login Form
                        </h2>
                        <LoginForm />
                        
                        <div className="mt-6 p-4 bg-white/60 rounded-lg">
                            <h3 className="font-semibold text-charcoal mb-2">Features:</h3>
                            <ul className="text-sm text-mid-gray space-y-1">
                                <li>✓ Input sanitization</li>
                                <li>✓ Remember me functionality</li>
                                <li>✓ Token storage management</li>
                                <li>✓ Detailed error messages</li>
                                <li>✓ Social login UI (disabled)</li>
                                <li>✓ Forgot password link</li>
                                <li>✓ Auto redirect on success</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-[var(--radius-card)] border border-white/60 shadow-[0_12px_40px_rgba(31,29,43,0.12)] p-8">
                    <h2 className="text-2xl font-bold text-charcoal mb-4">
                        API Endpoints
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-charcoal mb-2">Sign Up</h3>
                            <code className="block bg-warm-cream/50 p-3 rounded text-sm">
                                POST /api/auth/signup<br />
                                Body: {`{ email, password, displayName? }`}
                            </code>
                        </div>

                        <div>
                            <h3 className="font-semibold text-charcoal mb-2">Login</h3>
                            <code className="block bg-warm-cream/50 p-3 rounded text-sm">
                                POST /api/auth/login<br />
                                Body: {`{ email, password }`}
                            </code>
                        </div>

                        <div>
                            <h3 className="font-semibold text-charcoal mb-2">Get User (Protected)</h3>
                            <code className="block bg-warm-cream/50 p-3 rounded text-sm">
                                GET /api/auth/me<br />
                                Headers: Authorization: Bearer {`<token>`}
                            </code>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-ice-blue/30 rounded-lg">
                        <p className="text-sm text-charcoal">
                            <strong>💡 Tip:</strong> Check the browser console for detailed logs 
                            of API responses. Use the PowerShell test script in the backend folder 
                            to test all endpoints: <code className="bg-white px-2 py-1 rounded">.\test-api.ps1</code>
                        </p>
                    </div>
                </div>
                <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-[var(--radius-card)] border border-white/60 shadow-[0_12px_40px_rgba(31,29,43,0.12)] p-8">
                    <h2 className="text-2xl font-bold text-charcoal mb-4">
                        Security Features
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-coral mb-2">Input Sanitization</h3>
                            <p className="text-sm text-mid-gray mb-2">
                                All inputs are sanitized to prevent XSS attacks:
                            </p>
                            <ul className="text-sm text-mid-gray space-y-1">
                                <li>• Removes angle brackets (&lt;, &gt;)</li>
                                <li>• Trims whitespace</li>
                                <li>• Limits maximum length</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-coral mb-2">Validation Rules</h3>
                            <p className="text-sm text-mid-gray mb-2">
                                Client-side validation before API calls:
                            </p>
                            <ul className="text-sm text-mid-gray space-y-1">
                                <li>• Email format (regex)</li>
                                <li>• Password length (6-128 chars)</li>
                                <li>• Password confirmation match</li>
                                <li>• Required field checks</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-coral mb-2">Token Management</h3>
                            <p className="text-sm text-mid-gray mb-2">
                                Secure storage of authentication tokens:
                            </p>
                            <ul className="text-sm text-mid-gray space-y-1">
                                <li>• localStorage for "Remember Me"</li>
                                <li>• sessionStorage otherwise</li>
                                <li>• Stores idToken & refreshToken</li>
                                <li>• User object cached locally</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-coral mb-2">Error Handling</h3>
                            <p className="text-sm text-mid-gray mb-2">
                                Comprehensive error feedback:
                            </p>
                            <ul className="text-sm text-mid-gray space-y-1">
                                <li>• Network error detection</li>
                                <li>• Backend error parsing</li>
                                <li>• Field-level validation</li>
                                <li>• User-friendly messages</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
