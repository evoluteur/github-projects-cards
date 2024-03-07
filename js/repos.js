const user = "evoluteur"; 

let repos = [];
let reposSelection = [];
let reposCount = 0;

async function fetchProjects() {
  const response = await fetch(`https://api.github.com/users/${user}/repos`);
  repos = reposSelection = await response.json();
  reposCount = repos.length;
  reposStars = 0;
  repos.forEach((r) => (reposStars += r.stargazers_count));
}

const fDate = (d) => new Date(d).toDateString().substring(4);

const filter = (searchString) => {
  reposSelection = repos.filter((r) => r.name.includes(searchString));
  setRepos(render(reposSelection));
  // setSummary();
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

const links = (r) => {
  const n = r.name;
  const ln = r?.language ? r.language + ": " : "";
  const links = [
    `<a href="https://github.com/${user}/${n}" target="code${n}">Code</a>`,
  ];
  if (r?.homepage) {
    links.push(`<a href="${r?.homepage}" target="demo${n}">Demo</a>`);
  }
  if (r.stargazers_count) {
    links.push(
      `<a href="https://star-history.com/#${user}/${n}" target="sh${n}">Star History</a>`
    );
  }
  return "<div>" + ln + links.join(" - ") + "</div>";
};

const starIcon = `<span class="crud-icon">
<svg viewBox="0 0 20 20"><path d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z"></path></svg>
  </span>`;
const forkIcon = `<span class="crud-icon">
<svg role="presentation" viewBox="0 0 22 22"><title>source-fork</title><path d="M6,2A3,3 0 0,1 9,5C9,6.28 8.19,7.38 7.06,7.81C7.15,8.27 7.39,8.83 8,9.63C9,10.92 11,12.83 12,14.17C13,12.83 15,10.92 16,9.63C16.61,8.83 16.85,8.27 16.94,7.81C15.81,7.38 15,6.28 15,5A3,3 0 0,1 18,2A3,3 0 0,1 21,5C21,6.32 20.14,7.45 18.95,7.85C18.87,8.37 18.64,9 18,9.83C17,11.17 15,13.08 14,14.38C13.39,15.17 13.15,15.73 13.06,16.19C14.19,16.62 15,17.72 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.72 9.81,16.62 10.94,16.19C10.85,15.73 10.61,15.17 10,14.38C9,13.08 7,11.17 6,9.83C5.36,9 5.13,8.37 5.05,7.85C3.86,7.45 3,6.32 3,5A3,3 0 0,1 6,2M6,4A1,1 0 0,0 5,5A1,1 0 0,0 6,6A1,1 0 0,0 7,5A1,1 0 0,0 6,4M18,4A1,1 0 0,0 17,5A1,1 0 0,0 18,6A1,1 0 0,0 19,5A1,1 0 0,0 18,4M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z"></path></svg>
    </span>`;
const repoIcon = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" style="fill:white" >
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
    </svg>`;

const stars = (r) => `<span class="stars">
${r?.stargazers_count > 0 ? starIcon + r.stargazers_count : ""}
${r?.forks_count > 0 ? forkIcon + r.forks_count : ""}
 </span>`;

const render = (selection) => {
  const sel = selection || reposSelection;
  const h = sel.map((r) => {
    const name = r?.name || "";
    return `<div class="project-card">
      <h2 class="pcard-title flex-edge-cols">
        <span>${name}</span>${stars(r)}
      </h2>
      <div>
        <div class="desc">${r?.description || name}</div>
        <div>${links(r)}</div>
        <div>${fDate(r.created_at)} -> ${fDate(r.updated_at)}</div>
      </div>
    </div>`;
  });
  return h.join("");
};

const total = () => `
<span class="stars">
    <span>${repoIcon} ${reposCount}</span>
    <span>${starIcon} ${reposStars}</span>
</span>`;

const setRepos = (html) =>
  (document.getElementById("repos").innerHTML =
    html ||
    '<div class="noresults">No results. The search criteria is too restrictive.</div>');

const setupCodePage = async () => {
  const sortField = localStorage.getItem("gh-projects-sort");
  if (sortField) {
    document.getElementById("sortPicker").value = sortField;
  }
  await fetchProjects();
  // setRepos(render());
  sort(sortField || "name");
  document.getElementById("title").innerHTML =
    user + ' at GitHub <span id="total-stars">' + total() + "</span>";
};
