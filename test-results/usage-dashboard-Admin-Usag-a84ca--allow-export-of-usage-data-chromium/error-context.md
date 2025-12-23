# Page snapshot

```yaml
- generic [ref=e1]:
  - region "Notifications alt+T"
  - main [ref=e2]:
    - generic [ref=e3]:
      - navigation [ref=e4]:
        - link "logo" [ref=e5] [cursor=pointer]:
          - /url: /
          - img "logo" [ref=e6]
        - link "Sign Up" [ref=e7] [cursor=pointer]:
          - /url: /sign-up
      - generic [ref=e9]:
        - generic [ref=e11]: Welcome back!
        - generic [ref=e15]:
          - generic [ref=e16]:
            - textbox "Enter email address" [ref=e18]: admin@test.com
            - generic [ref=e20]:
              - textbox "Enter password" [active] [ref=e21]: password123
              - button [ref=e22] [cursor=pointer]:
                - img [ref=e23]
            - button "Login" [ref=e26] [cursor=pointer]
          - link "Forgot your password?" [ref=e28] [cursor=pointer]:
            - /url: /forgot-password
        - generic [ref=e32]:
          - button "Login with Google" [ref=e33] [cursor=pointer]:
            - img
            - text: Login with Google
          - button "Login with GitHub" [ref=e34] [cursor=pointer]:
            - img
            - text: Login with GitHub
        - paragraph [ref=e39]:
          - text: Don't have an account?
          - link "Sign Up" [ref=e40] [cursor=pointer]:
            - /url: /sign-up
  - button "Open Next.js Dev Tools" [ref=e46] [cursor=pointer]:
    - img [ref=e47]
  - alert [ref=e50]
```