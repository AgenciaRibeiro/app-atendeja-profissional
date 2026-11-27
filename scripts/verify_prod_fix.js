async function run() {
  const html = await fetch("https://atendeja.minhaempresaautonoma.online/atendeja").then(r => r.text());
  const css = await fetch("https://atendeja.minhaempresaautonoma.online/admin.css").then(r => r.text());
  
  console.log("1. admin-app in HTML has inline style display: none ->", html.includes('id="admin-app" class="admin-layout" hidden style="display: none;"'));
  console.log("2. admin.css has [hidden] rule ->", css.includes("[hidden]") && css.includes("display: none !important;"));
  console.log("3. admin.css has .admin-layout[hidden] ->", css.includes(".admin-layout[hidden]"));
  
  const dashHtml = await fetch("https://atendeja.minhaempresaautonoma.online/login-paulopintor").then(r => r.text());
  console.log("4. dashboard.html has app-layout hidden by default ->", dashHtml.includes('id="app-layout" hidden style="display: none;"'));
}
run().catch(console.error);
