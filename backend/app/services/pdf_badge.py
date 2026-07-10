def generate_svg_badge(guest_name: str, guest_role: str, event_title: str, ticket_code: str) -> str:
    """
    Generates a beautiful SVG badge for check-in and entry.
    """
    # Color scheme based on role
    role_colors = {
        "vip": {"bg": "url(#gold-grad)", "text": "#FFF", "accent": "#fbbf24", "label": "VIP ACCESS"},
        "speaker": {"bg": "url(#blue-grad)", "text": "#FFF", "accent": "#60a5fa", "label": "GUEST SPEAKER"},
        "staff": {"bg": "url(#red-grad)", "text": "#FFF", "accent": "#f87171", "label": "EVENT STAFF"},
        "attendee": {"bg": "url(#indigo-grad)", "text": "#FFF", "accent": "#818cf8", "label": "GENERAL ADMISSION"}
    }
    
    role_key = guest_role.lower()
    if role_key not in role_colors:
        role_key = "attendee"
        
    cfg = role_colors[role_key]
    
    svg = f"""<svg width="350" height="500" viewBox="0 0 350 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <!-- Gradients -->
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b" />
            <stop offset="50%" stop-color="#311042" />
            <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
        <linearGradient id="red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#180f2a" />
            <stop offset="50%" stop-color="#2a0f1b" />
            <stop offset="100%" stop-color="#b91c1c" />
        </linearGradient>
        <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#4f46e5" />
        </linearGradient>
        <clipPath id="rounded-corners">
            <rect x="0" y="0" width="350" height="500" rx="20" ry="20" />
        </clipPath>
    </defs>
    
    <!-- Card Base -->
    <g clip-path="url(#rounded-corners)">
        <rect width="350" height="500" fill="{cfg['bg']}" />
        <rect width="350" height="500" fill="none" stroke="{cfg['accent']}" stroke-width="4" />
        
        <!-- Header Banner -->
        <rect x="0" y="0" width="350" height="50" fill="rgba(0,0,0,0.4)" />
        <text x="175" y="32" font-family="'Inter', sans-serif" font-weight="900" font-size="14" fill="{cfg['accent']}" text-anchor="middle" letter-spacing="3">{cfg['label']}</text>
        
        <!-- Event Name -->
        <text x="175" y="110" font-family="'Inter', sans-serif" font-weight="bold" font-size="20" fill="#FFFFFF" text-anchor="middle">{event_title}</text>
        <line x1="80" y1="130" x2="270" y2="130" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        
        <!-- Guest Photo Mock / Circle -->
        <circle cx="175" cy="210" r="45" fill="none" stroke="{cfg['accent']}" stroke-width="3" />
        <text x="175" y="218" font-family="'Inter', sans-serif" font-size="30" fill="{cfg['accent']}" text-anchor="middle" font-weight="bold">{guest_name[0] if guest_name else '?'}</text>
        
        <!-- Guest Name -->
        <text x="175" y="295" font-family="'Inter', sans-serif" font-weight="bold" font-size="24" fill="#FFFFFF" text-anchor="middle">{guest_name}</text>
        <text x="175" y="318" font-family="'Inter', sans-serif" font-weight="medium" font-size="14" fill="rgba(255,255,255,0.6)" text-anchor="middle">{guest_role.upper()}</text>
        
        <!-- QR Code Placeholder -->
        <g transform="translate(140, 350)">
            <rect width="70" height="70" fill="white" rx="5" ry="5" />
            <!-- Inner QR mock boxes -->
            <rect x="5" y="5" width="20" height="20" fill="black" />
            <rect x="10" y="10" width="10" height="10" fill="white" />
            <rect x="45" y="5" width="20" height="20" fill="black" />
            <rect x="50" y="10" width="10" height="10" fill="white" />
            <rect x="5" y="45" width="20" height="20" fill="black" />
            <rect x="10" y="50" width="10" height="10" fill="white" />
            
            <rect x="30" y="30" width="10" height="10" fill="black" />
            <rect x="40" y="40" width="10" height="10" fill="black" />
            <rect x="30" y="50" width="10" height="10" fill="black" />
            <rect x="50" y="30" width="10" height="10" fill="black" />
        </g>
        
        <!-- Ticket Code -->
        <text x="175" y="450" font-family="monospace" font-size="12" fill="rgba(255,255,255,0.4)" text-anchor="middle">{ticket_code}</text>
        
        <!-- Footer -->
        <rect x="0" y="480" width="350" height="20" fill="rgba(0,0,0,0.3)" />
        <text x="175" y="493" font-family="'Inter', sans-serif" font-size="9" fill="rgba(255,255,255,0.3)" text-anchor="middle">POWERED BY EVENTSPHERE</text>
    </g>
</svg>"""
    return svg

def generate_svg_certificate(guest_name: str, event_title: str, date_str: str) -> str:
    """
    Generates a gorgeous landscape SVG certificate.
    """
    svg = f"""<svg width="800" height="550" viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="gold-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="50%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="550" fill="url(#bg-grad)" />
    
    <!-- Double border -->
    <rect x="20" y="20" width="760" height="510" fill="none" stroke="url(#gold-border)" stroke-width="4" rx="10" ry="10" />
    <rect x="30" y="30" width="740" height="490" fill="none" stroke="rgba(251, 191, 36, 0.3)" stroke-width="1" rx="8" ry="8" />
    
    <!-- Design elements (Corners) -->
    <path d="M 20 60 L 60 20 M 20 80 L 80 20 M 20 100 L 100 20" stroke="url(#gold-border)" stroke-width="2" />
    <path d="M 780 60 L 740 20 M 780 80 L 720 20 M 780 100 L 700 20" stroke="url(#gold-border)" stroke-width="2" />
    <path d="M 20 490 L 60 530 M 20 470 L 80 530 M 20 450 L 100 530" stroke="url(#gold-border)" stroke-width="2" />
    <path d="M 780 490 L 740 530 M 780 470 L 720 530 M 780 450 L 700 530" stroke="url(#gold-border)" stroke-width="2" />
    
    <!-- Certificate Content -->
    <g text-anchor="middle" font-family="'Times New Roman', serif">
        <text x="400" y="100" font-size="18" font-weight="bold" fill="#fbbf24" letter-spacing="4">CERTIFICATE OF ATTENDANCE</text>
        <text x="400" y="140" font-size="12" fill="rgba(255, 255, 255, 0.5)" letter-spacing="1">THIS IS PROUDLY PRESENTED TO</text>
        
        <!-- Recipient Name -->
        <text x="400" y="230" font-size="44" font-weight="bold" fill="#ffffff" font-family="'Inter', sans-serif" style="text-shadow: 0 4px 6px rgba(0,0,0,0.5);">{guest_name}</text>
        <line x1="200" y1="260" x2="600" y2="260" stroke="url(#gold-border)" stroke-width="2" />
        
        <!-- Description -->
        <text x="400" y="310" font-size="16" fill="rgba(255, 255, 255, 0.8)" font-family="'Inter', sans-serif">
            for actively participating in and completing
        </text>
        <text x="400" y="345" font-size="24" font-weight="bold" fill="#fbbf24" font-family="'Inter', sans-serif">
            {event_title}
        </text>
        <text x="400" y="380" font-size="14" fill="rgba(255, 255, 255, 0.6)" font-family="'Inter', sans-serif">
            held on the date of {date_str}
        </text>
        
        <!-- Signatures -->
        <g font-family="'Inter', sans-serif" font-size="12" fill="rgba(255, 255, 255, 0.7)">
            <!-- Left Signature -->
            <line x1="180" y1="460" x2="320" y2="460" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
            <text x="250" y="478">Event Director</text>
            <text x="250" y="445" font-family="'Brush Script MT', cursive, sans-serif" font-size="22" fill="#fbbf24">EventSphere Team</text>
            
            <!-- Seal / Badge in the middle -->
            <circle cx="400" cy="450" r="30" fill="#fbbf24" opacity="0.1" />
            <polygon points="400,430 408,445 425,445 412,455 417,472 400,460 383,472 388,455 375,445 392,445" fill="#fbbf24" />
            
            <!-- Right Signature -->
            <line x1="480" y1="460" x2="620" y2="460" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
            <text x="550" y="478">Authorized Host</text>
            <text x="550" y="445" font-family="'Brush Script MT', cursive, sans-serif" font-size="22" fill="#fbbf24">Antigravity AI</text>
        </g>
    </g>
</svg>"""
    return svg
