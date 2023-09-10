const theme = {
    name: 'cloudscape',
    tokens: {
        fonts: {
            default: {
            variable: {value: "Amazon Ember, Open Sans"},
            static: {value: "Amazon Ember, Open Sans"}
            }
        },
        colors: {
            pink: {
                10: { value: '#F2F8FD' }, //
                20: { value: '#033160' }, //
                40: { value: '#f453ce' },
                60: { value: '#0972D3' },
                80: { value: '#0972D3' }, //
                90: { value: '#033160' }, //
                100: { value: '#033160' }, //
            },
            purple: {
                10: { value: '#dfcefd' },
                20: { value: '#c4a6fb' },
                40: { value: '#a97df9' },
                60: { value: '#8c51f6' },
                80: { value: '#6618f4' },
                90: { value: '#4509b2' },
                100: { value: '#210555' },
            },
            green: {
                10: { value: '#31f38f' },
                20: { value: '#29ce79' },
                40: { value: '#22aa64' },
                60: { value: '#1b874f' },
                80: { value: '#14663c' },
                90: { value: '#0e4629' },
                100: { value: '#0e4629' },
            },
            neutral: {
                10: { value: '#e3dee3' },
                20: { value: '#bdb2bd' },
                40: { value: '#7b6a80' },
                60: { value: '#41354f' },
                80: { value: '#000716' },
                90: { value: '#7D8998' },
                100: { value: '#0c001f' },
            },
            brand: {
                primary: {
                    10: { value: '{colors.pink.10}' },
                    20: { value: '{colors.pink.20}' },
                    40: { value: '{colors.pink.40}' },
                    60: { value: '{colors.pink.60}' },
                    80: { value: '{colors.pink.80}' },
                    90: { value: '{colors.pink.90}' },
                    100: { value: '{colors.pink.100}' },
                },
                secondary: {
                    10: { value: '{colors.purple.10}' },
                    20: { value: '{colors.purple.20}' },
                    40: { value: '{colors.purple.40}' },
                    60: { value: '{colors.purple.60}' },
                    80: { value: '{colors.purple.80}' },
                    90: { value: '{colors.purple.90}' },
                    100: { value: '{colors.purple.100}' },
                },
            },
            border: {
                primary: { value: '{colors.neutral.90}' },
                secondary: { value: '{colors.neutral.80}' },
                tertiary: { value: '{colors.neutral.60}' },
            }
        },
        borderWidths: {
            small: { value: '2px' },
            medium: { value: '4px' },
            large: { value: '8px' },
        },
        radii: {
            xs: { value: '1rem' },
            small: { value: '1rem' },
            medium: { value: '1rem' },
            large: { value: '2rem' },
            xl: { value: '3rem' },
        },
        space: {
            xs: { value: '0.75rem' },
            small: { value: '1rem' },
            medium: { value: '1.5rem' },
            large: { value: '2rem' },
            xl: { value: '3rem' },
        },
        components: {
            button: {
                padding: { value: '{borderWidths.small}' },
                borderWidth: { value: '{borderWidths.small}' },
                borderRadius: { value: '{radii.large}' }
            },
        },
    }
}

export default theme;
