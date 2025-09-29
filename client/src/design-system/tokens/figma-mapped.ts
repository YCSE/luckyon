/**
 * Design tokens mapped from Figma design variables
 * These tokens are directly mapped from the Figma file to ensure consistency
 * Node ID: 85:96 (접속_로그인)
 */

export const figmaTokens = {
  // Colors from Figma
  colors: {
    // Base colors
    white: '#FFFFFF',
    identity: '#E56030', // Primary brand color (orange)

    // Text colors
    text: {
      primary: '#333333',    // text_기본
      secondary: '#777777',  // text2
      tertiary: '#AAAAAA',   // text3
      quaternary: '#BBBBBB', // text4
    },

    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F8F8',  // bg1
      hero: '#CCCCCC',      // Hero section background
    },

    // Line/Border colors
    line: {
      primary: '#CCCCCC',
      secondary: '#DDDDDD',  // line2
    }
  },

  // Typography from Figma
  typography: {
    // Font families
    fontFamily: {
      primary: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      secondary: 'Arial, sans-serif'
    },

    // Font styles mapped from Figma
    styles: {
      H1: {
        fontFamily: 'Pretendard',
        fontWeight: 700, // Bold
        fontSize: '65px',
        lineHeight: '80px',
        letterSpacing: '-3.25px'
      },
      H2: {
        fontFamily: 'Pretendard',
        fontWeight: 600, // SemiBold
        fontSize: '45px',
        lineHeight: '60px',
        letterSpacing: '-2.25px'
      },
      H5: {
        fontFamily: 'Pretendard',
        fontWeight: 700, // Bold
        fontSize: '25px',
        lineHeight: '35px',
        letterSpacing: '-1.25px'
      },
      H6: {
        fontFamily: 'Pretendard',
        fontWeight: 500, // Medium
        fontSize: '25px',
        lineHeight: '40px',
        letterSpacing: '-1.25px'
      },
      btn1: {
        fontFamily: 'Pretendard',
        fontWeight: 700, // Bold
        fontSize: '18px',
        lineHeight: '100%',
        letterSpacing: '-0.9px'
      },
      tab: {
        fontFamily: 'Pretendard',
        fontWeight: 600, // SemiBold
        fontSize: '16px',
        lineHeight: '100%',
        letterSpacing: '-0.8px'
      },
      sub1: {
        fontFamily: 'Pretendard',
        fontWeight: 300, // Light
        fontSize: '16px',
        lineHeight: '25px',
        letterSpacing: '-0.8px'
      },
      sub2: {
        fontFamily: 'Pretendard',
        fontWeight: 300, // Light
        fontSize: '14px',
        lineHeight: '100%',
        letterSpacing: '-0.7px'
      }
    }
  },

  // Component-specific tokens
  components: {
    hero: {
      height: '810px',
      borderRadius: '50px',
      background: '#CCCCCC'
    },
    card: {
      borderRadius: '20px',
      padding: '60px 80px',
      background: '#F8F8F8',
      gap: '50px'
    },
    button: {
      primary: {
        height: '60px',
        width: '250px',
        borderRadius: '100px',
        background: '#E56030',
        color: '#FFFFFF'
      }
    },
    input: {
      height: '60px',
      width: '400px',
      borderBottom: '1px solid #CCCCCC',
      placeholderColor: '#AAAAAA'
    },
    footer: {
      padding: '30px 0',
      background: '#F8F8F8',
      logoWidth: '102px',
      logoHeight: '20px'
    },
    serviceGrid: {
      columns: 2,
      rows: 3,
      gap: '30px',
      cardHeight: '260px'
    }
  },

  // Layout tokens
  layout: {
    maxWidth: '1200px',
    heroSectionHeight: '810px',
    contentPadding: {
      desktop: '150px 180px',
      mobile: '50px 20px'
    },
    sectionSpacing: '150px'
  },

  // Spacing scale (matching Figma auto-layout)
  spacing: {
    0: '0px',
    10: '10px',
    15: '15px',
    20: '20px',
    22: '22px',
    30: '30px',
    40: '40px',
    50: '50px',
    60: '60px',
    80: '80px',
    100: '100px',
    150: '150px'
  }
};

// Figma node ID mapping for Code Connect
export const figmaNodeIds = {
  loginPage: '85:96',
  hero: '85:130',
  heroTitle: '85:132',
  heroSubtitle: '85:133',
  sectionTitle: '85:162',
  serviceList: '141:104',
  serviceCards: {
    today: '141:105',
    saju: '141:108',
    compatibility: '141:111',
    love: '141:114',
    wealth: '141:117',
    tojung: '141:120'
  },
  loginSection: {
    tabs: '85:347',
    loginTab: '85:329',
    signupTab: '85:333',
    emailInput: '85:310',
    passwordInput: '85:311',
    loginButton: '85:313',
    signupPrompt: '85:312'
  },
  footer: '106:87'
};

// Export helper function to get styles for a specific component
export const getFigmaStyle = (component: string) => {
  switch (component) {
    case 'H1':
      return figmaTokens.typography.styles.H1;
    case 'H2':
      return figmaTokens.typography.styles.H2;
    case 'H5':
      return figmaTokens.typography.styles.H5;
    case 'H6':
      return figmaTokens.typography.styles.H6;
    case 'button':
      return figmaTokens.typography.styles.btn1;
    case 'tab':
      return figmaTokens.typography.styles.tab;
    case 'body':
      return figmaTokens.typography.styles.sub1;
    case 'caption':
      return figmaTokens.typography.styles.sub2;
    default:
      return figmaTokens.typography.styles.sub1;
  }
};