const STORAGE_KEY = "beforegram-account-v1";

const icons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5v10H15v-6H9v6H3z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 4 4"/></svg>',
  create: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.4 3.2-6.5 7.5-6.5s6.8 2.1 7.5 6.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-3.9-.9L3 20.5l1.5-4.7A8.4 8.4 0 1 1 21 11.5Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-9.6 20-2.1-8.3L2 10.3 22 2Z"/><path d="m10.3 13.7 4.8-4.8"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18l-7-4-7 4z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18"/><path d="M3 10h18M10 3v18"/></svg>',
  layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>'
};

const defaultAccount = () => ({
  username: "yourfutureaccount",
  displayName: "Your Future Account",
  avatar: "",
  bio: "Add a bio to introduce your future account.",
  category: "Digital creator",
  link: "",
  posts: []
});

let account = loadAccount();
let view = "landing";
let route = "home";
let activePostId = null;
let dashboardOpen = false;
let dashboardPostImage = "";
let viewerFollowing = false;
let circleImage = "";
let circleTiles = [];
let circleResult = null;
let circleBusy = false;

function loadAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.posts) ? { ...defaultAccount(), ...saved } : defaultAccount();
  } catch { return defaultAccount(); }
}

function saveAccount() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(account)); }
  catch { toast("That image is too large for this browser. Try a smaller file."); }
}

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function safeLink(value = "") {
  if (!value.trim()) return "";
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function initials() {
  return (account.displayName || account.username || "Y").split(/\s+/).slice(0, 2).map(x => x[0]).join("");
}

function avatar(size = "") {
  return account.avatar
    ? `<img class="avatar ${size}" src="${account.avatar}" alt="${esc(account.displayName)} avatar">`
    : `<div class="avatar avatar-fallback ${size}" aria-label="Avatar placeholder">${esc(initials())}</div>`;
}

function render() {
  const app = document.querySelector("#app");
  if (view === "landing") app.innerHTML = landingTemplate();
  if (view === "setup") app.innerHTML = setupTemplate();
  if (view === "simulator") app.innerHTML = simulatorTemplate();
  bindEvents();
}

function landingTemplate() {
  return `<section class="landing">
    <div class="landing-card">
      <div class="landing-mark" aria-hidden="true"></div>
      <h1>Build your Instagram before you launch it.</h1>
      <div class="landing-actions">
        <button class="primary" data-action="prepare">Start with my content</button>
        <button class="secondary" data-action="open-blank">Open blank Instagram</button>
      </div>
    </div>
  </section>`;
}

function setupTemplate() {
  return `<section class="setup"><div class="setup-panel">
    <header class="setup-head"><button class="icon-button" data-action="landing" aria-label="Back">${icons.back}</button><h1>Prepare your account</h1></header>
    <form id="setup-form">
      <div class="form-grid">
        ${field("Username", "username", account.username, "yourfutureaccount")}
        ${field("Display name", "displayName", account.displayName, "Your Future Account")}
        ${field("Category", "category", account.category, "Digital creator")}
        ${field("Link", "link", account.link, "yourwebsite.com")}
        <div class="field full"><label for="setup-bio">Bio</label><textarea id="setup-bio" name="bio" placeholder="What should people know?">${esc(account.bio)}</textarea></div>
        <div class="field"><label for="setup-avatar">Avatar</label><input id="setup-avatar" name="avatar" type="file" accept="image/*"></div>
        <div class="field"><label for="setup-posts">Post images</label><input id="setup-posts" name="posts" type="file" accept="image/*" multiple></div>
        <div class="field full"><label for="setup-captions">Captions</label><textarea id="setup-captions" name="captions" placeholder="One caption per image"></textarea><p class="hint">Captions are matched to images in order.</p></div>
      </div>
      <button class="primary setup-submit" type="submit">Generate my Instagram</button>
    </form>
  </div></section>`;
}

function field(label, name, value, placeholder) {
  return `<div class="field"><label for="setup-${name}">${label}</label><input id="setup-${name}" name="${name}" value="${esc(value)}" placeholder="${placeholder}"></div>`;
}

function simulatorTemplate() {
  return `<section class="workspace">
    <div class="stage">
      <div class="phone">
        <div class="status-bar"><span>9:41</span><span class="status-icons">● ◔ ▰</span></div>
        <div class="screen" id="screen">${routeTemplate()}</div>
        ${route === "comments" ? commentFormTemplate() : ""}
        ${navTemplate()}
      </div>
      <button class="edit-toggle" data-action="toggle-dashboard">Edit preview</button>
    </div>
    ${dashboardOpen ? dashboardTemplate() : ""}
  </section>`;
}

function routeTemplate() {
  if (route === "search") return searchTemplate();
  if (route === "circle") return circleTemplate();
  if (route === "story") return storyTemplate();
  if (route === "profile") return profileTemplate();
  if (route === "post") return postDetailTemplate();
  if (route === "comments") return commentsTemplate();
  return homeTemplate();
}

function navTemplate() {
  const current = ["post", "comments"].includes(route) ? "profile" : route === "story" ? "home" : route;
  return `<nav class="nav" aria-label="Instagram preview navigation">
    ${navButton("home", "Home", icons.home, current)}
    ${navButton("search", "Search", icons.search, current)}
    ${navButton("circle", "Circle fit", icons.layers, current)}
    ${navButton("profile", `${account.username} profile`, icons.profile, current)}
  </nav>`;
}

function navButton(name, label, icon, current) {
  return `<button data-route="${name}" class="${current === name ? "active" : ""}" aria-label="${label}">${icon}</button>`;
}

function homeTemplate() {
  return `<header class="screen-header home-header"><span class="wordmark">Instagram</span><div class="header-actions">${icons.heart}${icons.send}</div></header>
    <div class="stories"><button class="story" data-route="story"><span class="story-ring">${avatar()}</span><span>${esc(account.username)}</span></button></div>
    ${account.posts.length ? [...account.posts].reverse().map(postCard).join("") : emptyFeedTemplate()}`;
}

function emptyFeedTemplate() {
  return `<div class="empty-feed"><div><div class="empty-icon">${icons.profile}</div><h2>No posts from ${esc(account.username)} yet</h2><p>When this account shares a post, an audience member will see it here.</p></div></div>`;
}

function storyTemplate() {
  const latestPost = account.posts[account.posts.length - 1];
  return `<section class="story-view"><header class="story-header"><button class="icon-button" data-route="home" aria-label="Close story">${icons.back}</button>${avatar()}<strong>${esc(account.username)}</strong><span>now</span></header>
    ${latestPost ? `<img class="story-content" src="${latestPost.image}" alt="Story from ${esc(account.username)}">` : `<div class="story-empty">${avatar("large")}<strong>${esc(account.displayName)}</strong><span>@${esc(account.username)}</span></div>`}
    <div class="story-reply"><span>Send message</span>${icons.heart}${icons.send}</div>
  </section>`;
}

function postCard(post) {
  return `<article class="post-card">
    <div class="post-author">${avatar()}<button data-route="profile"><strong>${esc(account.username)}</strong><span>${esc(account.category)}</span></button></div>
    <img class="post-image" src="${post.image}" alt="Post by ${esc(account.username)}" data-post="${post.id}">
    <div class="action-row"><button aria-label="Like">${icons.heart}</button><button aria-label="Comment" data-comments="${post.id}">${icons.comment}</button><button aria-label="Share">${icons.send}</button><button class="save" aria-label="Save">${icons.save}</button></div>
    <div class="post-copy"><p><strong>${esc(account.username)}</strong> ${esc(post.caption)}</p><button data-comments="${post.id}">View ${post.comments?.length || 0} comments</button></div>
  </article>`;
}

function searchTemplate() {
  return `<div class="search-wrap"><input class="search-input" id="search-input" placeholder="Search" aria-label="Search accounts"></div>
    <div class="search-label">Accounts</div><div id="search-results">${searchResultTemplate("")}</div>`;
}

function searchResultTemplate(query) {
  const text = query.trim().toLowerCase();
  const matches = !text || account.username.toLowerCase().includes(text) || account.displayName.toLowerCase().includes(text);
  return matches ? `<button class="search-result" data-route="profile">${avatar()}<span><strong>${esc(account.username)}</strong><span>${esc(account.displayName)} · ${esc(account.category)}</span></span></button>` : `<div class="empty-feed"><div><h2>No accounts found</h2><p>Try searching for ${esc(account.username)}.</p></div></div>`;
}

function profileTemplate() {
  const link = safeLink(account.link);
  return `<header class="screen-header"><strong>${esc(account.username)}</strong><span class="header-right">${icons.more}</span></header>
    <section class="profile-head"><div class="profile-top">${avatar("large")}<div class="stats"><span><strong>${account.posts.length}</strong>posts</span><span><strong>0</strong>followers</span><span><strong>0</strong>following</span></div></div>
      <div class="profile-bio"><strong>${esc(account.displayName)}</strong><span>${esc(account.category)}</span><span>${esc(account.bio).replace(/\n/g, "<br>")}</span>${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(account.link)}</a>` : ""}</div>
      <div class="profile-buttons"><button class="small-button ${viewerFollowing ? "following" : "follow"}" data-action="toggle-follow">${viewerFollowing ? "Following" : "Follow"}</button><button class="small-button" data-action="message">Message</button></div>
    </section>
    <div class="profile-tabs"><button aria-label="Posts">${icons.grid}</button><button aria-label="Mentions">${icons.profile}</button></div>
    ${account.posts.length ? `<div class="profile-grid">${[...account.posts].reverse().map(p => `<button class="grid-post" data-post="${p.id}"><img src="${p.image}" alt="Open post"></button>`).join("")}</div>` : `<div class="empty-grid"><div><h3>No posts yet</h3><p>Create a post to see your future profile come alive.</p></div></div>`}`;
}

function circleTemplate() {
  if (circleBusy) return `<header class="screen-header"><strong>Circle fit</strong></header><div class="circle-loading"><span class="spinner"></span><strong>Reading your screenshot…</strong><p>Everything stays in this browser.</p></div>`;
  return `<header class="screen-header"><strong>Circle fit</strong></header><section class="circle-view">
    <div class="circle-intro"><h2>See yourself in the mix</h2><p>Upload a screenshot of Explore or a profile grid. We’ll rebuild the visual context and place your posts inside it—no Instagram login needed.</p></div>
    ${circleImage ? circleResultTemplate() : circleUploadTemplate()}
  </section>`;
}

function circleUploadTemplate() {
  return `<label class="circle-upload" for="circle-file">${icons.layers}<strong>Upload a grid screenshot</strong><span>Choose a screenshot centered on the posts</span></label>
    <input class="hidden" id="circle-file" type="file" accept="image/*">
    <p class="privacy-note">Processed locally. Your screenshot never leaves this device.</p>`;
}

function circleResultTemplate() {
  const ownPosts = [...account.posts].reverse().slice(0, 2);
  const insertAt = [2, 7];
  const mixedTiles = circleTiles.map((tile, index) => {
    const ownIndex = insertAt.indexOf(index);
    const post = ownPosts[ownIndex];
    return post
      ? `<button class="circle-tile own-tile" data-post="${post.id}"><img src="${post.image}" alt="Your post in the imported grid"><span>Your post</span></button>`
      : `<div class="circle-tile"><img src="${tile}" alt="Imported reference tile"></div>`;
  }).join("");
  return `${account.posts.length ? scoreTemplate() : `<div class="circle-callout"><strong>Add a post to test the fit</strong><p>Your reference grid is ready. Add content from the editor outside the phone, then return here.</p><button class="primary" data-action="toggle-dashboard">Open editor</button></div>`}
    <div class="circle-grid" aria-label="Your posts mixed into the imported grid">${mixedTiles}</div>
    <div class="circle-actions"><label class="small-button" for="circle-file">Try another screenshot</label><button class="small-button" data-action="clear-circle">Remove</button></div>
    <input class="hidden" id="circle-file" type="file" accept="image/*">
    <p class="privacy-note">This score compares visual palette, brightness, and saturation—not likely engagement or audience interest.</p>`;
}

function scoreTemplate() {
  const label = circleResult.score >= 85 ? "Feels native" : circleResult.score >= 70 ? "Related, with contrast" : "Distinct from this circle";
  return `<div class="fit-score"><div class="score-ring"><strong>${circleResult.score}</strong><span>/100</span></div><div><h3>${label}</h3><p>Visual fit with this screenshot</p></div></div>
    <div class="fit-metrics"><span><strong>${circleResult.palette}</strong>Palette</span><span><strong>${circleResult.brightness}</strong>Brightness</span><span><strong>${circleResult.saturation}</strong>Saturation</span></div>`;
}

function activePost() { return account.posts.find(p => String(p.id) === String(activePostId)); }

function postDetailTemplate() {
  const post = activePost();
  if (!post) { route = "profile"; return profileTemplate(); }
  return `<header class="screen-header"><span class="header-left"><button class="icon-button" data-route="profile" aria-label="Back">${icons.back}</button></span><strong>Post</strong><span class="header-right"><button class="icon-button" data-action="post-menu" aria-label="Post options">${icons.more}</button></span></header>${postCard(post)}`;
}

function commentsTemplate() {
  const post = activePost();
  if (!post) { route = "profile"; return profileTemplate(); }
  const comments = post.comments || [];
  return `<header class="screen-header"><span class="header-left"><button class="icon-button" data-post="${post.id}" aria-label="Back">${icons.back}</button></span><strong>Comments</strong><span class="header-right"></span></header>
    <div class="comments"><div class="comment">${avatar()}<div><p><strong>${esc(account.username)}</strong> ${esc(post.caption)}</p><div class="comment-time">Preview post</div></div></div>
      ${comments.map(c => `<div class="comment">${avatar()}<div><p><strong>${esc(account.username)}</strong> ${esc(c.text)}</p><div class="comment-time">Just now</div></div></div>`).join("")}
    </div>`;
}

function commentFormTemplate() {
  return `<form class="comment-form" id="comment-form"><input id="comment-input" placeholder="Add a comment…" aria-label="Add a comment"><button type="submit">Post</button></form>`;
}

function dashboardTemplate() {
  return `<aside class="dashboard" aria-label="Account editor"><header class="dashboard-head"><h2>Edit account</h2><button class="icon-button" data-action="toggle-dashboard" aria-label="Close editor">×</button></header>
    <div class="dashboard-avatar">${avatar()}<div><label for="dashboard-avatar">Change profile photo</label><input class="hidden" id="dashboard-avatar" type="file" accept="image/*"></div></div>
    ${dashboardField("Username", "username", account.username)}
    ${dashboardField("Display name", "displayName", account.displayName)}
    ${dashboardField("Category", "category", account.category)}
    ${dashboardField("Link", "link", account.link)}
    <div class="field"><label for="dash-bio">Bio</label><textarea id="dash-bio" data-account="bio">${esc(account.bio)}</textarea></div>
    <div class="dashboard-divider"></div>
    <form id="dashboard-post-form"><h3>Add a post</h3>
      <label class="dashboard-post-upload" for="dashboard-post-file">${dashboardPostImage ? `<img src="${dashboardPostImage}" alt="Selected post preview">` : `<span>${icons.create} Choose a photo</span>`}</label>
      <input class="hidden" id="dashboard-post-file" type="file" accept="image/*">
      <div class="field"><label for="dashboard-post-caption">Caption</label><textarea id="dashboard-post-caption" placeholder="Write a caption…"></textarea></div>
      <button class="primary setup-submit" type="submit">Add to simulated account</button>
    </form>
    <button class="secondary setup-submit" data-action="close-dashboard">Done editing</button>
    <p class="dashboard-note">Changes are saved on this device and update every view in the simulator.</p>
  </aside>`;
}

function dashboardField(label, key, value) {
  return `<div class="field"><label for="dash-${key}">${label}</label><input id="dash-${key}" data-account="${key}" value="${esc(value)}"></div>`;
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach(el => el.addEventListener("click", handleAction));
  document.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => go(el.dataset.route)));
  document.querySelectorAll("[data-post]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.post; go("post"); }));
  document.querySelectorAll("[data-comments]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.comments; go("comments"); }));

  document.querySelector("#setup-form")?.addEventListener("submit", submitSetup);
  document.querySelector("#comment-form")?.addEventListener("submit", submitComment);
  document.querySelector("#dashboard-post-form")?.addEventListener("submit", submitDashboardPost);
  document.querySelector("#dashboard-post-file")?.addEventListener("change", async event => { dashboardPostImage = await fileToDataUrl(event.target.files[0]); render(); });
  document.querySelector("#circle-file")?.addEventListener("change", importCircleScreenshot);
  document.querySelector("#dashboard-avatar")?.addEventListener("change", async event => { account.avatar = await fileToDataUrl(event.target.files[0]); saveAccount(); render(); });
  document.querySelector("#search-input")?.addEventListener("input", event => { document.querySelector("#search-results").innerHTML = searchResultTemplate(event.target.value); document.querySelector("#search-results [data-route]")?.addEventListener("click", () => go("profile")); });
  document.querySelectorAll("[data-account]").forEach(input => input.addEventListener("input", event => { account[event.target.dataset.account] = event.target.value; saveAccount(); renderScreenOnly(); }));
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "prepare") { view = "setup"; render(); }
  if (action === "landing") { view = "landing"; render(); }
  if (action === "open-blank") { view = "simulator"; route = "home"; render(); }
  if (action === "toggle-dashboard") { dashboardOpen = !dashboardOpen; render(); }
  if (action === "close-dashboard") { dashboardOpen = false; render(); }
  if (action === "post-menu") editPost();
  if (action === "toggle-follow") { viewerFollowing = !viewerFollowing; render(); }
  if (action === "message") toast(`Message preview for @${account.username}`);
  if (action === "clear-circle") { circleImage = ""; circleTiles = []; circleResult = null; render(); }
}

function go(nextRoute) {
  route = nextRoute;
  render();
}

function renderScreenOnly() {
  const screen = document.querySelector("#screen");
  if (screen) screen.innerHTML = routeTemplate();
  document.querySelectorAll("#screen [data-route]").forEach(el => el.addEventListener("click", () => go(el.dataset.route)));
  document.querySelectorAll("#screen [data-post]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.post; go("post"); }));
  document.querySelectorAll("#screen [data-comments]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.comments; go("comments"); }));
}

async function submitSetup(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  account.username = cleanUsername(form.get("username")) || defaultAccount().username;
  account.displayName = form.get("displayName").trim() || defaultAccount().displayName;
  account.bio = form.get("bio").trim();
  account.category = form.get("category").trim();
  account.link = form.get("link").trim();
  const avatarFile = form.get("avatar");
  if (avatarFile?.size) account.avatar = await fileToDataUrl(avatarFile);
  const files = form.getAll("posts").filter(file => file.size);
  const captions = form.get("captions").split("\n");
  for (let index = 0; index < files.length; index++) {
    account.posts.push({ id: crypto.randomUUID(), image: await fileToDataUrl(files[index]), caption: captions[index]?.trim() || "", comments: [] });
  }
  saveAccount();
  view = "simulator";
  route = "profile";
  render();
}

async function submitDashboardPost(event) {
  event.preventDefault();
  if (!dashboardPostImage) return toast("Choose a photo first.");
  const caption = document.querySelector("#dashboard-post-caption").value.trim();
  const post = { id: crypto.randomUUID(), image: dashboardPostImage, caption, comments: [] };
  account.posts.push(post);
  activePostId = post.id;
  dashboardPostImage = "";
  saveAccount();
  if (circleTiles.length) circleResult = await calculateFit(circleTiles, account.posts.slice(-3));
  dashboardOpen = false;
  route = "profile";
  render();
  toast("Post added to your preview");
}

function submitComment(event) {
  event.preventDefault();
  const input = document.querySelector("#comment-input");
  const text = input.value.trim();
  const post = activePost();
  if (!text || !post) return;
  post.comments = post.comments || [];
  post.comments.push({ id: crypto.randomUUID(), text });
  saveAccount();
  render();
}

function editPost() {
  const post = activePost();
  if (!post) return;
  const nextCaption = window.prompt("Edit the caption, or type DELETE to remove this post.", post.caption);
  if (nextCaption === null) return;
  if (nextCaption.trim() === "DELETE") return deletePost(post);
  post.caption = nextCaption.trim();
  saveAccount();
  render();
}

function deletePost(post) {
  if (!window.confirm("Delete this post from the preview?")) return;
  account.posts = account.posts.filter(item => item.id !== post.id);
  saveAccount();
  route = "profile";
  render();
}

function cleanUsername(value = "") { return value.trim().replace(/^@/, "").replace(/\s+/g, "").toLowerCase(); }

async function importCircleScreenshot(event) {
  const file = event.target.files[0];
  if (!file) return;
  circleBusy = true;
  render();
  try {
    circleImage = await fileToDataUrl(file);
    circleTiles = await cropGrid(circleImage);
    circleResult = account.posts.length ? await calculateFit(circleTiles, account.posts.slice(-3)) : null;
  } catch {
    circleImage = "";
    circleTiles = [];
    circleResult = null;
    toast("We couldn’t read that screenshot. Try a JPG or PNG.");
  }
  circleBusy = false;
  render();
}

async function cropGrid(source) {
  const image = await loadImage(source);
  const side = Math.min(image.width, image.height);
  const startX = Math.max(0, (image.width - side) / 2);
  const startY = Math.max(0, (image.height - side) / 2);
  const tileSize = side / 3;
  return Array.from({ length: 9 }, (_, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 240;
    const column = index % 3;
    const row = Math.floor(index / 3);
    canvas.getContext("2d").drawImage(image, startX + column * tileSize, startY + row * tileSize, tileSize, tileSize, 0, 0, 240, 240);
    return canvas.toDataURL("image/jpeg", .82);
  });
}

async function calculateFit(referenceTiles, posts) {
  const reference = averageFeatureSet(await Promise.all(referenceTiles.map(imageFeatures)));
  const own = averageFeatureSet(await Promise.all(posts.map(post => imageFeatures(post.image))));
  const paletteDistance = Math.hypot(reference.r - own.r, reference.g - own.g, reference.b - own.b) / 441.7;
  const brightnessDistance = Math.abs(reference.brightness - own.brightness) / 255;
  const saturationDistance = Math.abs(reference.saturation - own.saturation) / 255;
  const metric = distance => Math.max(0, Math.round(100 * (1 - distance)));
  return {
    score: Math.max(0, Math.round(100 * (1 - .55 * paletteDistance - .25 * brightnessDistance - .2 * saturationDistance))),
    palette: metric(paletteDistance),
    brightness: metric(brightnessDistance),
    saturation: metric(saturationDistance)
  };
}

async function imageFeatures(source) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, 32, 32);
  const pixels = context.getImageData(0, 0, 32, 32).data;
  let r = 0, g = 0, b = 0, brightness = 0, saturation = 0, count = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 20) continue;
    const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
    r += red; g += green; b += blue;
    brightness += .299 * red + .587 * green + .114 * blue;
    saturation += Math.max(red, green, blue) - Math.min(red, green, blue);
    count++;
  }
  return { r: r / count, g: g / count, b: b / count, brightness: brightness / count, saturation: saturation / count };
}

function averageFeatureSet(features) {
  return features.reduce((average, feature) => {
    Object.keys(average).forEach(key => average[key] += feature[key] / features.length);
    return average;
  }, { r: 0, g: 0, b: 0, brightness: 0, saturation: 0 });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function fileToDataUrl(file) {
  if (!file) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .84));
      };
      image.onerror = () => resolve(reader.result);
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

render();
