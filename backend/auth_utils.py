"""
Authentication and Role-Based Authorization Decorators for RailSim Express.
Strictly verifies roles server-side to prevent unauthorized access.
"""

from functools import wraps
from flask import session, redirect, url_for, flash, abort, render_template, request, jsonify

def login_required(f):
    """Ensure user is signed in before accessing protected routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized', 'message': 'Please log in to continue.'}), 401
            flash('Please log in to continue.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """
    Ensure user is signed in AND possesses the 'admin' role.
    Rejects unauthorized access with HTTP 403 Forbidden.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized', 'message': 'Administrative authentication required.'}), 401
            flash('Administrative authentication required.', 'danger')
            return redirect(url_for('login'))
        if session.get('role') != 'admin':
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Forbidden', 'message': 'Administrative privileges required.'}), 403
            return render_template('403.html'), 403
        return f(*args, **kwargs)
    return decorated_function
