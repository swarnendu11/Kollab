export const PASSWORD_POLICY_MESSAGE =
  "Password must be 6-8 characters and include uppercase, lowercase, a number, and a symbol (e.g., @, #, !)."

export function isValidPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    password.length <= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export function getPasswordPolicyMessage(): string {
  return PASSWORD_POLICY_MESSAGE
}

export default PASSWORD_POLICY_MESSAGE
