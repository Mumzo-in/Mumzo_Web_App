# Mumzo System Architecture (Draw.io / Mermaid Import)

This document contains the **Mermaid.js** diagram code representing the Mumzo system architecture.

Draw.io (diagrams.net) supports importing Mermaid code natively.

---

## 1. Mermaid Code

Copy the block below:

```mermaid
graph TD
  User["Customer App (User)"]
  AdminUser["Admin Portal (Staff)"]
  
  subgraph Hostinger ["Hostinger DNS Panel"]
    DNS["DNS Zone Records<br/>(mumzo.in)"]
  end

  subgraph Railway ["Railway Project Container Mesh"]
    Storefront["Storefront Static Site<br/>(mumzo.in)"]
    AdminPanel["Admin Static Site<br/>(admin.mumzo.in)"]
    APIServer["Bun & Hono API Server<br/>(api.mumzo.in)"]
    Database[("PostgreSQL DB<br/>(Port 5432)")]
  end
  
  R2[("Cloudflare R2 Storage<br/>(cdn.mumzo.in)")]
  Resend["Resend Email Service<br/>(Transactional/OTP)"]

  DNS -.->|Points mumzo.in| Storefront
  DNS -.->|Points admin.mumzo.in| AdminPanel
  DNS -.->|Points api.mumzo.in| APIServer
  DNS -.->|Points cdn.mumzo.in| R2
  DNS -.->|TXT Records| Resend

  User -.->|Browse| Storefront
  AdminUser -.->|Manage| AdminPanel
  
  Storefront ===>|HTTPS REST Requests| APIServer
  AdminPanel ===>|HTTPS REST Requests| APIServer
  
  APIServer --->|TCP Queries & Session Persistence| Database
  APIServer -.->|Generate Presigned URLs| R2
  APIServer -.->|Send Emails| Resend
  
  User ===>|Fetch Images/Banners| R2
```

---

## 2. How to import this into Draw.io (diagrams.net)

1. Open a blank canvas on [Draw.io](https://app.diagrams.net/).
2. On the top menu toolbar, click **+ (Insert)** or select **Arrange** -> **Insert**.
3. Hover over **Advanced** and click **Mermaid**.
4. Paste the Mermaid code block from above into the text box.
5. Click **Insert**. Draw.io will automatically parse the code and render it as editable visual shapes on your canvas!
