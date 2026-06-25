const bringButtonTokens = {
  backgroundColor: 'rgb(248, 248, 248)',
  hoverBackgroundColor: 'rgb(238, 238, 240)',
  textColor: 'rgb(37, 48, 54)',
  border: '1px solid rgba(151, 151, 151, 0.1)',
  disabledBorder: '1px solid rgba(151, 151, 151, 0.08)',
  borderRadius: '4px',
  boxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.2)',
  hoverBoxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.4)',
  focusOutline: '3px solid rgba(37, 48, 54, 0.24)',
  disabledBackgroundColor: 'rgba(238, 238, 240, 0.78)',
  disabledTextColor: 'rgba(37, 48, 54, 0.72)',
} as const;

export const appOwnedBringButtonSx = {
  backgroundColor: bringButtonTokens.backgroundColor,
  color: bringButtonTokens.textColor,
  border: bringButtonTokens.border,
  borderRadius: bringButtonTokens.borderRadius,
  boxShadow: bringButtonTokens.boxShadow,
  transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    backgroundColor: bringButtonTokens.hoverBackgroundColor,
    border: bringButtonTokens.border,
    boxShadow: bringButtonTokens.hoverBoxShadow,
  },
  '&:focus-visible': {
    outline: bringButtonTokens.focusOutline,
    outlineOffset: '2px',
  },
} as const;

export const appOwnedBringButtonDisabledSx = {
  backgroundColor: bringButtonTokens.disabledBackgroundColor,
  color: bringButtonTokens.disabledTextColor,
  border: bringButtonTokens.disabledBorder,
  boxShadow: 'none',
} as const;
