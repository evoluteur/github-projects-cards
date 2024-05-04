const user = "evoluteur";
const ghURL = `https://github.com/${user}`;
const showMTF = true;

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

const linksHTML = (r) => {
  const n = r.name;
  const ln = r?.language ? r.language + ": " : "";
  const links = [`<a href="${ghURL}/${n}" target="${n}">Code</a>`];
  if (r?.homepage) {
    links.push(`<a href="${r?.homepage}" target="demo${n}">Demo</a>`);
  }
  if (r.stargazers_count) {
    links.push(
      `<a href="https://star-history.com/#${user}/${n}&Date" target="sh${n}">Star History</a>`
    );
  }
  return "<div>" + ln + links.join(" - ") + "</div>";
};

const icoStar = `<span class="crud-icon">
  <svg viewBox="0 0 20 20"><path d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z"></path></svg>
</span>`;
const icoFork = `<span class="crud-icon">
  <svg role="presentation" viewBox="0 0 22 22"><path d="M6,2A3,3 0 0,1 9,5C9,6.28 8.19,7.38 7.06,7.81C7.15,8.27 7.39,8.83 8,9.63C9,10.92 11,12.83 12,14.17C13,12.83 15,10.92 16,9.63C16.61,8.83 16.85,8.27 16.94,7.81C15.81,7.38 15,6.28 15,5A3,3 0 0,1 18,2A3,3 0 0,1 21,5C21,6.32 20.14,7.45 18.95,7.85C18.87,8.37 18.64,9 18,9.83C17,11.17 15,13.08 14,14.38C13.39,15.17 13.15,15.73 13.06,16.19C14.19,16.62 15,17.72 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.72 9.81,16.62 10.94,16.19C10.85,15.73 10.61,15.17 10,14.38C9,13.08 7,11.17 6,9.83C5.36,9 5.13,8.37 5.05,7.85C3.86,7.45 3,6.32 3,5A3,3 0 0,1 6,2M6,4A1,1 0 0,0 5,5A1,1 0 0,0 6,6A1,1 0 0,0 7,5A1,1 0 0,0 6,4M18,4A1,1 0 0,0 17,5A1,1 0 0,0 18,6A1,1 0 0,0 19,5A1,1 0 0,0 18,4M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z"></path></svg>
</span>`;
const icoRepo = `<svg aria-hidden="true" height="16" width="16" viewBox="0 0 16 16" version="1.1" data-view-component="true" style="fill:white" >
  <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
</svg>`;
const icoMTF =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="16" width="16" ><path d="M7.2,11.2C8.97,11.2 10.4,12.63 10.4,14.4C10.4,16.17 8.97,17.6 7.2,17.6C5.43,17.6 4,16.17 4,14.4C4,12.63 5.43,11.2 7.2,11.2M14.8,16A2,2 0 0,1 16.8,18A2,2 0 0,1 14.8,20A2,2 0 0,1 12.8,18A2,2 0 0,1 14.8,16M15.2,4A4.8,4.8 0 0,1 20,8.8C20,11.45 17.85,13.6 15.2,13.6A4.8,4.8 0 0,1 10.4,8.8C10.4,6.15 12.55,4 15.2,4Z" /></svg>';

const linkStars = (repo) =>
  `<a href="${ghURL}/${repo.name}/stargazers" target="${repo.name}-stars">${icoStar} ${repo.stargazers_count}</a>`;
const linkForks = (repo) =>
  `<a href="${ghURL}/${repo.name}/forks" target="${repo.name}-forks">${icoFork} ${repo.forks_count}</a>`;

const starsHTML = (r) => `<span class="stars">
${r?.stargazers_count > 0 ? linkStars(r) : ""}
${r?.forks_count > 0 ? linkForks(r) : ""}
 </span>`;

const cardHTML = (name, project) => `<div class="project-card">
 <h2 class="pcard-title">
   <span><a href="${ghURL}/${name}" target="${name}">${name}</a>
   </span><span>${starsHTML(project)}</span>
 </h2>
 <div>
   <div>${linksHTML(project)}</div>
   <div class="desc">${project?.description || name}</div>
   <div>${fDate(project.created_at)} - ${fDate(project.updated_at)}</div>
 </div>
</div>`;

const totalHTML = () =>
  `<span class="stars">
  ${
    showMTF
      ? `<span><a href="https://${user}.github.io/meet-the-fans/" target="_blank">${icoMTF}</a></span>`
      : ""
  }
  <span><a href="${ghURL}?tab=repositories" target="_blank">${icoRepo} ${reposCount}</a></span>
  <span>${icoStar} ${reposStars}</span>
</span>`;

const pageTitleHTML = () =>
  `<a href="${ghURL}" target="${user}">` +
  user +
  '</a> at GitHub <span id="total-stars">' +
  totalHTML() +
  "</span>";

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
  const sortField = localStorage.getItem("gh-projects-sort");
  if (sortField) {
    document.getElementById("sortPicker").value = sortField;
  }
  await fetchProjects();
  sort(sortField || "name");
  document.getElementById("title").innerHTML = pageTitleHTML();
};
