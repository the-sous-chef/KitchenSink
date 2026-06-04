export const clerkAppearance = {
    variables: {
        colorPrimary: '#5BA8A0',
        colorBackground: '#FFFFFF',
        colorText: '#2D3436',
        colorTextSecondary: '#636E72',
        colorTextOnPrimaryBackground: '#FFFFFF',
        colorDanger: '#E17055',
        colorSuccess: '#4CAF7C',
        colorInputBackground: '#FFFFFF',
        colorInputText: '#2D3436',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontFamilyButtons: 'Inter, system-ui, sans-serif',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: {
            normal: 400,
            medium: 500,
            bold: 600,
        },
    },
    layout: {
        socialButtonsPlacement: 'bottom' as const,
        socialButtonsVariant: 'blockButton' as const,
    },
    elements: {
        card: {
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '1.25rem',
            boxShadow: '0 1px 3px rgba(45,52,54,0.04)',
            padding: '2.5rem',
        },
        cardBox: {
            borderRadius: '1.25rem',
        },
        headerTitle: {
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#2D3436',
        },
        headerSubtitle: {
            fontSize: '0.875rem',
            color: '#636E72',
        },
        dividerLine: {
            borderColor: '#B2BEC3',
            borderWidth: '1px',
        },
        dividerText: {
            color: '#636E72',
            fontSize: '0.75rem',
        },
        formFieldLabel: {
            color: '#2D3436',
            fontSize: '0.875rem',
            fontWeight: '500',
        },
        formFieldInput: {
            backgroundColor: 'white',
            borderColor: '#B2BEC3',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            color: '#2D3436',
            padding: '0.75rem 1rem',
        },
        formFieldInput__focus: {
            borderColor: '#5BA8A0',
        },
        formFieldAction: {
            color: '#5BA8A0',
            fontSize: '0.875rem',
            fontWeight: '500',
        },
        formFieldAction__hover: {
            color: '#3D8B85',
        },
        formButtonPrimary: {
            backgroundColor: '#5BA8A0',
            borderRadius: '9999px',
            fontSize: '1rem',
            fontWeight: '600',
            textTransform: 'none' as const,
            padding: '0.75rem 1.5rem',
        },
        formButtonPrimary__hover: {
            backgroundColor: '#3D8B85',
        },
        formButtonSecondary: {
            borderColor: '#E8917A',
            borderWidth: '1px',
            borderRadius: '9999px',
            color: '#E8917A',
            fontSize: '1rem',
            fontWeight: '500',
            textTransform: 'none' as const,
        },
        formButtonSecondary__hover: {
            backgroundColor: 'rgba(232,145,122,0.08)',
        },
        socialButtonsBlockButton: {
            borderRadius: '9999px',
            borderColor: '#B2BEC3',
            borderWidth: '1px',
            fontSize: '0.875rem',
            fontWeight: '500',
            textTransform: 'none' as const,
            backgroundColor: 'white',
            color: '#2D3436',
        },
        socialButtonsBlockButton__hover: {
            backgroundColor: '#F5F5F5',
        },
        socialButtonsIconButton: {
            borderRadius: '9999px',
            borderColor: '#B2BEC3',
        },
        footerActionLink: {
            color: '#5BA8A0',
            fontSize: '0.875rem',
            fontWeight: '500',
        },
        footerActionLink__hover: {
            color: '#3D8B85',
            textDecoration: 'underline',
        },
        footerActionText: {
            color: '#636E72',
            fontSize: '0.875rem',
        },
        alertText: {
            color: '#E17055',
            fontSize: '0.875rem',
        },
        alert: {
            borderRadius: '0.75rem',
        },
        otpCodeFieldInput: {
            borderRadius: '0.75rem',
            borderColor: '#B2BEC3',
        },
        otpCodeFieldInput__focus: {
            borderColor: '#5BA8A0',
        },
        identityPreviewEditButton: {
            color: '#5BA8A0',
        },
        formResendCodeLink: {
            color: '#5BA8A0',
        },
        userButtonPopoverCard: {
            borderRadius: '1.25rem',
            boxShadow: '0 4px 6px -1px rgba(45,52,54,0.07)',
        },
        userButtonPopoverActionButton__hover: {
            backgroundColor: 'rgba(91,168,160,0.08)',
        },
        userButtonPopoverActionButtonText: {
            color: '#2D3436',
        },
        userButtonPopoverFooter: {
            borderTop: '1px solid rgba(178,190,195,0.3)',
        },
    },
};
