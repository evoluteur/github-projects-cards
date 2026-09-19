// config options
const DEFAULT_USER = "evoluteur";
let user = DEFAULT_USER;
const ghURL = () => `https://github.com/${user}`;
const showMTF = true;

let repos = [];
let reposSelection = [];
let reposCount = 0;
let searchText = "";
let languageFilter = "";

async function fetchProjects() {
  const response = await fetch(
    `https://api.github.com/users/${user}/repos?per_page=100`,
  );
  const data = await response.json();
  if (!response.ok || !Array.isArray(data)) {
    throw new Error(data?.message || "Unable to fetch repositories");
  }
  repos = reposSelection = data;
  reposCount = repos.length;
  reposStars = 0;
  repos.forEach((r) => (reposStars += r.stargazers_count));
}

const populateLanguageFilter = () => {
  const select = document.getElementById("langFilter");
  const languages = [
    ...new Set(repos.map((r) => r.language).filter(Boolean)),
  ].sort();
  select.innerHTML =
    `<option value="">All</option>` +
    languages
      .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join("");
  select.value = "";
};

const resetFilters = () => {
  searchText = "";
  languageFilter = "";
  document.getElementById("filter").value = "";
  populateLanguageFilter();
};

// "Projects", "Projects Charts" or "Stars History", set by each page
let pageLabel = "Projects";

const setPageMetaTitle = () => {
  document.title = `GitHub ${pageLabel} for ${user}`;
};

const updateBookmarkableUrl = () => {
  const url = new URL(window.location);
  url.searchParams.set("user", user);
  history.replaceState(null, "", url);
};

const updateNavLink = () => {
  const link = document.getElementById("navUserLink");
  if (link) {
    link.href =
      user === DEFAULT_USER ? "https://evoluteur.github.io/" : ghURL();
  }
};

// the crumb back to the cards page, on the pages that still have one
const setBackLink = () => {
  const back = document.getElementById("backLink");
  if (back) {
    back.href = `index.html?user=${encodeURIComponent(user)}`;
  }
};

const changeUser = async (newUser) => {
  const trimmed = (newUser || "").trim();
  if (!trimmed || trimmed === user) {
    return;
  }
  const previousUser = user;
  user = trimmed;
  const summary = document.getElementById("summary");
  summary.textContent = "Loading...";
  try {
    await fetchProjects();
    summary.textContent = "";
    if (chartsPage) {
      renderCharts();
      setBackLink();
    } else {
      resetFilters();
      sort(localStorage.getItem("gh-projects-sort") || "name");
    }
    updateBookmarkableUrl();
    setPageMetaTitle();
    updateNavLink();
  } catch (e) {
    user = previousUser;
    summary.textContent = `Could not find GitHub user "${trimmed}".`;
  }
  if (chartsPage) {
    document.getElementById("chartsTitle").innerHTML = chartsTitleHTML();
  } else {
    document.getElementById("title").innerHTML = pageTitleHTML();
  }
};

const escapeHtml = (txt) =>
  txt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const fDate = (d) => new Date(d).toDateString().substring(4);

const applyFilters = () => {
  // the find box matches project names regardless of case
  const search = searchText.toLowerCase();
  reposSelection = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search) &&
      (!languageFilter || r.language === languageFilter),
  );
  setRepos(render(reposSelection));
};

const filter = (searchString) => {
  searchText = searchString;
  applyFilters();
};

const filterByLanguage = (lang) => {
  languageFilter = lang;
  applyFilters();
};

const sort = (field) => {
  localStorage.setItem("gh-projects-sort", field);
  const fEx = field === "name" ? 1 : -1;
  reposSelection = reposSelection.sort((a, b) => {
    const af = a[field];
    const bf = b[field];
    if (af === bf) {
      return 0;
    }
    return fEx * (af > bf ? 1 : -1);
  });
  setRepos(render(reposSelection));
};

// Colors match GitHub's own per-language colors (github-linguist colors.yml)
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Python: "#3572A5",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Go: "#00ADD8",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Shell: "#89e051",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Rust: "#dea584",
  Dart: "#00B4AB",
  Vue: "#41b883",
  "Visual Basic .NET": "#945db7",
};
const langColor = (lang) => LANGUAGE_COLORS[lang] || "#ededed";

const linksHTML = (r) => {
  const n = r.name;
  const links = [`<a href="${ghURL()}/${n}" target="${n}">Code</a>`];
  if (r?.homepage) {
    links.push(`<a href="${r?.homepage}" target="demo${n}">Demo</a>`);
  }
  if (r.stargazers_count) {
    links.push(
      `<a href="https://star-history.com/#${user}/${n}" target="sh${n}">Star History</a>`,
    );
  }
  return links.join(" - ");
};

// GitHub's own octicons, so the icons match github.com exactly
const icoStar = `<span class="crud-icon">
  <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
</span>`;
const icoFork = `<span class="crud-icon">
  <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
</span>`;
const icoRepo = `<svg aria-hidden="true" height="16" width="16" viewBox="0 0 16 16" version="1.1" data-view-component="true" >
  <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
</svg>`;
const icoPencil = `<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758ZM12.5 2.487a.25.25 0 0 0-.354 0L11.263 3.36l1.377 1.378.873-.873a.25.25 0 0 0 0-.354Zm-1.586 2.79L9.537 3.9l-6.19 6.19-.929 3.25 3.25-.929Z"></path></svg>`;
// header icons: GitHub's own mark, the rest from Material Design Icons.
// Same markup in npm-pulse and github-projects-cards so both sites match.
const icoStars = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" /></svg>`;

const icoCards = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3" /></svg>`;

const icoChart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" /></svg>`;

const icoNpm = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><path d="M3,3H21V21H3V3M5.5,5.5V18.5H12V8.5H16.5V18.5H18.5V5.5H5.5Z" /></svg>`;

const icoPulse = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><path d="M3.5,18.49L9.5,12.48L13.5,16.48L22,6.92L20.59,5.51L13.5,13.48L9.5,9.48L2,16.99L3.5,18.49Z" /></svg>`;

const icoMTF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><path d="M7.2,11.2C8.97,11.2 10.4,12.63 10.4,14.4C10.4,16.17 8.97,17.6 7.2,17.6C5.43,17.6 4,16.17 4,14.4C4,12.63 5.43,11.2 7.2,11.2M14.8,16A2,2 0 0,1 16.8,18A2,2 0 0,1 14.8,20A2,2 0 0,1 12.8,18A2,2 0 0,1 14.8,16M15.2,4A4.8,4.8 0 0,1 20,8.8C20,11.45 17.85,13.6 15.2,13.6A4.8,4.8 0 0,1 10.4,8.8C10.4,6.15 12.55,4 15.2,4Z" /></svg>`;

const gpcSiteURL = "https://evoluteur.github.io/github-projects-cards/";
const pulseSiteURL = "https://evoluteur.github.io/npm-pulse/";
const fansSiteURL = "https://evoluteur.github.io/meet-the-fans";

// the same five links at the right of the page title on every page,
// the icon of the current page shown dimmed instead of linked.
// current is one of: gh-cards, gh-charts, npm, npm-charts, fans
// Meet-the-Fans sits next to the site picker, not with the page icons
const fansLinkHTML = () =>
  `<a class="icon-link fans-link" href="${fansSiteURL}?user=${encodeURIComponent(
    user,
  )}" target="_blank" title="Meet the Fans" aria-label="Meet the Fans">${icoMTF}</a>`;

const headerLinkHTML = (link, current) =>
  link.id === current
    ? `<span class="icon-link current" title="${link.title}" aria-label="${link.title}">${link.icon}</span>`
    : `<a class="icon-link" href="${link.href}"${
        link.external ? ' target="_blank"' : ""
      } title="${link.title}" aria-label="${link.title}">${link.icon}</a>`;

const headerLinksHTML = (current) => {
  const links = headerLinks();
  return `<span class="header-links">${links
    .map((l) => headerLinkHTML(l, current))
    .join("")}</span>`;
};

const headerLinks = () => {
  const u = encodeURIComponent(user);
  return [
    {
      id: "gh-cards",
      icon: icoCards,
      title: "GitHub cards",
      href: `index.html?user=${u}`,
    },
    {
      id: "gh-charts",
      icon: icoChart,
      title: "GitHub charts",
      href: `dashboard.html?user=${u}`,
    },
    // {
    //   id: "gh-stars",
    //   icon: icoStars,
    //   title: "Stars history",
    //   href: `stars-history.html?user=${u}`,
    // },
  ];
};

const linkStars = (repo) =>
  `<a class="stat" href="${ghURL()}/${repo.name}/stargazers" target="${
    repo.name
  }-stars" aria-label="stars">${icoStar} ${repo.stargazers_count}</a>`;
const linkForks = (repo) =>
  `<a class="stat" href="${ghURL()}/${repo.name}/forks" target="${
    repo.name
  }-forks" aria-label="forks">${icoFork} ${repo.forks_count}</a>`;

// language + stars + forks on one row, like a github.com repo card
const statsHTML = (r) => {
  const parts = [];
  if (r?.language) {
    parts.push(
      `<span class="lang"><span class="lang-dot" style="background-color:${langColor(
        r.language,
      )}"></span>${r.language}</span>`,
    );
  }
  if (r?.stargazers_count > 0) {
    parts.push(linkStars(r));
  }
  if (r?.forks_count > 0) {
    parts.push(linkForks(r));
  }
  return parts.length ? `<div class="repo-stats">${parts.join("")}</div>` : "";
};

const cardHTML = (name, project) => `<div class="project-card">
  <div>
    <h2 class="pcard-title">
      <span><a href="${ghURL()}/${name}" target="${name}">${escapeHtml(
        name,
      )}</a></span>
    </h2>
    ${statsHTML(project)}
    <div class="desc">${escapeHtml(project?.description || name)}</div>
    <div class="p-links">${linksHTML(project)}</div>
  </div>
  <div>${fDate(project.created_at)} - ${fDate(project.updated_at)}</div>
</div>`;

const totalHTML = () =>
  `<span class="stars">
  <span><a href="${ghURL()}?tab=repositories" target="_blank" aria-label="repositories">${icoRepo} ${reposCount}</a></span>
  <span>${icoStar} ${reposStars}</span>
</span>`;

// the charts pages set this, so the picker lands on the charts of the other site
let chartsPage = false;

// the same user seen on GitHub or on npm (npm-Pulse)
const goToSite = (id) => {
  const u = encodeURIComponent(user);
  if (id === "npm") {
    window.location.href = chartsPage
      ? `${pulseSiteURL}dashboard.html?user=${u}`
      : `${pulseSiteURL}?user=${u}`;
  }
};

const sitePickerHTML = () => `<select
    class="site-picker"
    onchange="goToSite(this.value)"
    aria-label="Show this user on another site"
    title="Show this user on another site"
  >
    <option value="github" selected>GitHub</option>
    <option value="npm">npm</option>
  </select>`;

const focusUserInput = () => {
  const input = document.getElementById("userInput");
  input.focus();
  input.select();
};

// the username, editable in place with a pencil, on every page
const userEditHTML = () => `<span class="user-edit">
    <input
      type="text"
      id="userInput"
      class="user-input"
      value="${escapeHtml(user)}"
      size="${Math.max(user.length, 4)}"
      onchange="changeUser(this.value)"
      aria-label="GitHub username"
    />
    <button
      type="button"
      class="edit-icon"
      onclick="focusUserInput()"
      aria-label="Edit GitHub username"
    >${icoPencil}</button>
  </span>`;

const pageTitleHTML = () =>
  `<span id="title-main">
    ${userEditHTML()}
    ${sitePickerHTML()}
    ${fansLinkHTML()}
    <span id="total-stars">${totalHTML()}</span>
  </span>
  ${headerLinksHTML("gh-cards")}`;

const render = (selection) => {
  const sel = selection || reposSelection;
  const h = sel.map((r) => {
    const name = r?.name || "";
    return cardHTML(name, r);
  });
  return h.join("");
};

const setRepos = (html) =>
  (document.getElementById("repos").innerHTML =
    html ||
    '<div class="noresults">No results. The search criteria is too restrictive.</div>');

const setupCodePage = async () => {
  const userParam = new URLSearchParams(window.location.search).get("user");
  if (userParam) {
    user = userParam.trim() || user;
  }
  const sortField = localStorage.getItem("gh-projects-sort");
  if (sortField) {
    document.getElementById("sortPicker").value = sortField;
  }
  try {
    await fetchProjects();
  } catch (e) {
    document.getElementById("summary").textContent =
      `Could not find GitHub user "${user}".`;
    user = DEFAULT_USER;
    await fetchProjects();
  }
  populateLanguageFilter();
  sort(sortField || "name");
  updateBookmarkableUrl();
  setPageMetaTitle();
  updateNavLink();
  document.getElementById("title").innerHTML = pageTitleHTML();
};

// const allStarsURL = () =>
//   "https://star-history.com/#" +
//   repos
//     .filter((r) => r.stargazers_count)
//     .map((r) => user + "/" + r.name)
//     .join("&");
