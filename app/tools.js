export function $(selector, f) {
  if (f === undefined) return document.querySelector(selector);
  else document.querySelectorAll(selector).forEach(f);
}

export function fetchJSON(url, token, options = {}) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (token !== undefined) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  return new Promise((resolve, reject) =>
    fetch(url, { ...options, headers })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          resolve(res.json());
        } else {
          const error = new Error("Error fetching data");
          error.status = res.status;
          reject(error);
        }
      })
      .catch((err) => reject(err))
  );
}

export function include(selector, url, urlcontroller) {
  fetch(url, { cache: "no-cache" })
    .then((res) => res.text())
    .then((html) => {
      $(`#${selector}`).innerHTML = html;
      import(urlcontroller).then((controller) => {
        controller.default();
      });
    })
    .catch(function (err) {
      console.log("Failed to fetch page: ", err);
    });
}

export function navigate(view, data) {
  return new Promise((resolve, reject) => {
    fetch(`views/${view}.html`, { cache: "no-cache" })
      .then((res) => res.text())
      .then((html) => {
        $("#content").innerHTML = html;
        import(`./controllers/${view}.js`)
          .then((controller) => {
            controller.default(data);
            resolve();
          })
          .catch((err) => {
            console.error("Failed to import controller:", err);
            reject(err);
          });
      })
      .catch((err) => {
        console.error("Failed to fetch page:", err);
        reject(err);
      });
  });
}

export const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function reviver(key, value) {
  if (typeof value === "string" && dateFormat.test(value)) {
    return new Date(value);
  }
  return value;
}

export function getParameterByName(name) {
  let match = RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}
