export default class SVG_Models {
    constructor() {
    }

    init() {
        this.drawMoon();
        this.drawSound();
        this.drawTrophy();
        this.drawProfile();
    }

    drawMoon() {
        return `
        <svg width="100%" height="100%" viewBox="0 0 200 200" 
                xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
            <defs>
                <mask id="moonMask">
                <rect width="200" height="200" fill="white"/>
                <circle cx="140" cy="100" r="60" fill="black"/>
                </mask>
            </defs>

            <ellipse 
                cx="100" 
                cy="100" 
                rx="60" 
                ry="60" 
                fill="#5f5fac" 
                mask="url(#moonMask)"
            />
        </svg>
      `;
    }

    drawSound() {
        return `
       <svg width="100%" height="100%" viewBox="0 0 200 200" 
                xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
            <rect x="50" y="80" width="28" height="40" fill="#5f5fac" />
            <path d="M 80 80 
                    L 80 120 
                    L 120 150 
                    L 120 50 
                Z" fill="#5f5fac" />
            
            <defs>
                <clipPath id="cut-off-left">
            <path d="M 125 80 
                    L 125 120 
                    L 200 200 
                    L 200 0 
                Z" fill="#5f5fac" />
                </clipPath>
            </defs>

            <circle cx="120" cy="100" r="20" fill="none" stroke="#5f5fac" 
                    stroke-width="4" clip-path="url(#cut-off-left)" />
            <circle cx="120" cy="100" r="40" fill="none" stroke="#5f5fac" 
                    stroke-width="4" clip-path="url(#cut-off-left)" />
            <circle cx="120" cy="100" r="60" fill="none" stroke="#5f5fac" 
                    stroke-width="4" clip-path="url(#cut-off-left)"/>
        </svg>
      `;
    }

    drawTrophy() {
        return `
       <svg width="100%" height="100%" viewBox="0 0 200 200" 
                xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
            <rect x="70" y="160" width="60" height="20" fill="#333333" />
            <rect x="80" y="140" width="40" height="18" fill="#333333" />
            <rect x="90" y="100" width="20" height="38" fill="#333333" />

            <defs>
                <clipPath id="cut-off-top">
                <rect x="0" y="50" width="200" height="100" />
                </clipPath>
            </defs>

            <ellipse 
                cx="100" 
                cy="40  " 
                rx="50" 
                ry="58" 
                fill="#333333"
                clip-path="url(#cut-off-top)"
            />
        </svg>
      `;
    }

    drawProfile() {
        return `
       <svg width="100%" height="100%" viewBox="0 0 200 200" 
                xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
        
            <circle cx="100" cy="70" r="30" fill="#333333" />

           <defs>
                <clipPath id="cut-off-bottom">
                <rect x="0" y="70" width="200" height="100" />
                </clipPath>
            </defs>

            <ellipse 
                cx="100" 
                cy="165" 
                rx="50" 
                ry="60" 
                fill="#333333"
                clip-path="url(#cut-off-bottom)"
            />

        </svg>

      `;
    }

}

