const bodyEl = document.body;

function getSessionId() {
  return bodyEl.dataset.sessionId || localStorage.getItem("session_id") || "";
}

function setSessionId(sessionId) {
  if (sessionId) {
    localStorage.setItem("session_id", sessionId);
  }
}

function setAdminFlag(isAdmin) {
  if (typeof isAdmin !== "undefined") {
    localStorage.setItem("is_admin", String(isAdmin));
  }
}

function setUserId(userId) {
  if (typeof userId !== "undefined") {
    localStorage.setItem("userId", String(userId));
  }
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const sessionId = getSessionId();
  if (sessionId) {
    headers.set("SESSIONID", sessionId);
  }
  if (options.json) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }
  return fetch(path, { ...options, headers });
}

async function hashPassword(message) {
  if (!window.crypto || !window.crypto.subtle) {
    return message;
  }
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function initLogoutButton() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      await apiFetch("/api/logout/", { method: "POST" });
    } finally {
      localStorage.removeItem("session_id");
      localStorage.removeItem("is_admin");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      window.location.href = "/";
    }
  });
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const hashedPassword = await hashPassword(password);

    try {
      const response = await apiFetch("/api/user_signin/", {
        method: "POST",
        json: {
          username,
          password: hashedPassword,
        },
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setSessionId(data.SessionId);
        setAdminFlag(data.isAdmin);
        setUserId(data.userId);
        localStorage.setItem("username", username);
        // if (data.isAdmin == true) {
        //   window.location.href = "/admin";
        // } else {
        window.location.href = "/dashboard";
        // }
        return;
      }
      if (errorEl) errorEl.textContent = data.status || "Login failed";
    } catch (err) {
      if (errorEl) errorEl.textContent = "Server error";
    }
  });
}

function initUsersPage() {

  let currentPage = 1;
  const pageSize = 20;
  let allUsers = [];

  const tableBody = document.getElementById("users-table-body");
  const statusEl = document.getElementById("users-status");
  const refreshBtn = document.getElementById("refresh-users");
  const responseEl = document.getElementById("users-json");
  const modal = document.getElementById("user-modal");
  const openModalBtn = document.getElementById("open-user-modal");
  const form = document.getElementById("add-user-form");
  const formError = document.getElementById("user-form-error");

  const closeModal = () => {
    if (modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
  };

  const openModal = () => {
    if (modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }
  };

  if (modal) {
    modal.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.dataset && target.dataset.close === "true") {
        closeModal();
      }
    });
  }

  if (openModalBtn) {
    openModalBtn.addEventListener("click", openModal);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadUsers();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formError) formError.textContent = "";

      const password = document.getElementById("user-password").value;
      const confirm = document.getElementById("user-password-confirm").value;

      if (password !== confirm) {
        if (formError) formError.textContent = "Passwords do not match.";
        return;
      }

      const hashedPassword = await hashPassword(password);

      const payload = {
        username: document.getElementById("user-username").value.trim(),
        email: document.getElementById("user-email").value.trim(),
        senderName: document.getElementById("user-sender").value.trim(),
        smsLimit: Number(document.getElementById("user-sms-limit").value),
        port: Number(document.getElementById("user-port").value),
        fullName: document.getElementById("user-full-name").value.trim(),
        companyName: document.getElementById("user-company").value.trim(),
        msisdn: document.getElementById("user-msisdn").value.trim(),
        password: hashedPassword,
        actualPassword: password,
        isBulkUploadEnabled: document.getElementById("user-bulk").checked,
      };

      try {
        const response = await apiFetch("/api/add_user/", {
          method: "POST",
          json: payload,
        });
        const data = await response.json();
        if (response.ok && data.status === "success") {
          closeModal();
          form.reset();
          loadUsers();
        } else if (formError) {
          formError.textContent = data.status || "Unable to add user.";
        }
      } catch (err) {
        if (formError) formError.textContent = "Server error.";
      }
    });
  }

  async function loadUsers() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    if (statusEl) statusEl.textContent = "";

    try {
      const response = await apiFetch("/api/all_smpp_clients/");
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.status || "Failed to load users.");
      }
      // renderUsers(data.smppClients || []);

      allUsers = data.smppClients || [];
      currentPage = 1;
      renderPaginatedUsers();

      if (responseEl) {
        responseEl.textContent = JSON.stringify(data, null, 2);
      }
      // if (statusEl) statusEl.textContent = `Showing ${data.smppClients.length} users.`;
    } catch (err) {
      if (statusEl) statusEl.textContent = "Unable to load users.";
      if (responseEl) responseEl.textContent = "Unable to load response.";
      tableBody.innerHTML = "<tr><td colspan='5' class='table-muted'>No users available.</td></tr>";
    }
  }

  function renderPaginatedUsers() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    const paginatedUsers = allUsers.slice(start, end);

    renderUsers(paginatedUsers, "users-table-body");
    updatePaginationUI();
  }

  function updatePaginationUI() {
    const pageInfo = document.getElementById("page-info");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    const totalPages = Math.ceil(allUsers.length / pageSize);

    if (allUsers.length <= pageSize) {
      pagination.style.display = "none";
      return;
    } else {
      pagination.style.display = "flex";
    }

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPaginatedUsers();
    }
  });

  document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(allUsers.length / pageSize);

    if (currentPage < totalPages) {
      currentPage++;
      renderPaginatedUsers();
    }
  });

  function renderUsers(users, elementId) {
    const tableBody = document.getElementById(elementId);
    tableBody.innerHTML = "";

    if (!users.length) {
      tableBody.innerHTML = "<tr><td colspan='5'>No users found</td></tr>";
      return;
    }

    users.forEach((user) => {
      const row = document.createElement("tr");

      row.appendChild(createCell(user.user_name || "-"));
      row.appendChild(createCell(user.email || "-"));
      row.appendChild(createCell(user.sms_limit ?? "-"));
      row.appendChild(createCell(user.today_sms_count ?? "-"));
      row.appendChild(createCell(user.port ?? "-"));

      // 🔥 TOGGLE CELL
      const statusCell = document.createElement("td");

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = Boolean(user.is_active);
      toggle.className = "toggle-switch";


      // 👉 IMPORTANT: toggle click logic
      toggle.addEventListener("change", (e) => {
        e.preventDefault();

        selectedUserId = user.user_id;
        selectedStatus = toggle.checked;
        currentToggle = toggle;

        // revert until confirmed
        toggle.checked = !toggle.checked;

        openStatusModal(selectedStatus);
      });

      statusCell.appendChild(toggle);
      row.appendChild(statusCell);

      tableBody.appendChild(row);
    });
  }

  function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  }

  // =========================
  // MODAL OPEN/CLOSE
  // =========================
  function openStatusModal(status) {
    const modal = document.getElementById("status-modal");
    const title = document.getElementById("status-modal-title");

    title.textContent = status ? "Activate User" : "Deactivate User";
    modal.style.display = "flex";
  }

  function closeStatusModal() {
    const modal = document.getElementById("status-modal");
    modal.style.display = "none";

    document.getElementById("status-form").reset();
    document.getElementById("status-error").textContent = "";
  }

  // =========================
  // FORM SUBMIT
  // =========================
  document.getElementById("status-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const reason = document.getElementById("status-reason").value.trim();
    const errorEl = document.getElementById("status-error");

    if (!reason) {
      errorEl.textContent = "Reason is required";
      return;
    }

    try {
      await updateUserStatus(selectedUserId, selectedStatus, reason);

      closeStatusModal();
      loadUsers();
    } catch (err) {
      errorEl.textContent = "Failed to update status";
    }
  });

  // =========================
  // CANCEL BUTTON
  // =========================
  document.getElementById("cancel-status").addEventListener("click", () => {
    closeStatusModal();
  });

  // =========================
  // BACKDROP CLOSE (optional)
  // =========================
  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", closeStatusModal);
  });

  // =========================
  // API CALL
  // =========================
  async function updateUserStatus(userId, status, reason) {
    const response = await apiFetch("/api/active_deactive_user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId,
        status: status,
        reason: reason
      })
    });

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error("API failed");
    }
  }

  loadUsers();
}

document.addEventListener("DOMContentLoaded", () => {
  if (bodyEl.dataset.sessionId) {
    setSessionId(bodyEl.dataset.sessionId);
  }
  if (bodyEl.dataset.isAdmin) {
    setAdminFlag(bodyEl.dataset.isAdmin === "true");
  }

  initLogoutButton();

  const page = bodyEl.dataset.page;
  if (page === "login") initLoginPage();
  if (page === "users") initUsersPage();
  if (page === "user_info") initUserInfoPage();
});


document.addEventListener("DOMContentLoaded", function () {
  loadPorts();
});

async function loadPorts() {

  try {
    const response = await apiFetch("/api/all_smpp_ports");
    const data = await response.json();
    if (!response.ok || data.status !== "success") {
      throw new Error(data.status || "Failed to load users.");
    }
    renderTable(data.smppPorts || []);

    // if (statusEl) statusEl.textContent = `Showing ${data.smppPorts.length} users.`;
  } catch (err) {
    // if (statusEl) statusEl.textContent = "Unable to load users.";
    // if (responseEl) responseEl.textContent = "Unable to load response.";
    // tableBody.innerHTML = "<tr><td colspan='5' class='table-muted'>No users available.</td></tr>";
  }

}

function renderTable(ports) {
  const tableBody = document.getElementById("ports-table-body");
  tableBody.innerHTML = "";

  ports.forEach(p => {
    const row = `
            <tr>
                <td>${p.port}</td>
                <td>${p.system_id}</td>
                <td>${p.password}</td>
                <td>${p.is_read_only_sms ? "Sms reading" : "Sms delivering"}</td>
            </tr>
        `;
    tableBody.innerHTML += row;
  });
}


function initUserInfoPage() {

  const tableBody = document.getElementById("client-table-body");
  // const statusEl = document.getElementById("client-status");

  let userId = localStorage.getItem("userId");

  async function loadUser() {
    if (!tableBody) return;


    loadUsersByUserId(tableBody, userId)

  }



  function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text || "-";
    return td;
  }

  // close dropdown on outside click


  // =========================
  // INIT
  // =========================
  loadUser();
}

async function loadUsersByUserId(tableBody, userId) {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (typeof userId == "undefined") {
    userId = localStorage.getItem("userId")
  }

  try {
    const response = await apiFetch("/api/user_by_id/" + userId);
    const data = await response.json();
    if (!response.ok || data.status !== "success") {
      throw new Error(data.status || "Failed to load user info.");
    }
    renderUsers(data.userVo, "client-table-body");

    // if (responseEl) {
    //   responseEl.textContent = JSON.stringify(data, null, 2);
    // }
    // if (statusEl) statusEl.textContent = `Showing ${data.smppClients.length} users.`;
  } catch (err) {

    console.log(err);
    // if (responseEl) responseEl.textContent = "Unable to load response.";
    tableBody.innerHTML = "<tr><td colspan='5' class='table-muted'>No users available.</td></tr>";
  }



  function renderUsers(users, elementId) {
    const tableBody = document.getElementById(elementId);
    tableBody.innerHTML = "";

    if (!users.length) {
      tableBody.innerHTML = "<tr><td colspan='5'>No users found</td></tr>";
      return;
    }

    users.forEach((user) => {
      const row = document.createElement("tr");

      row.appendChild(createCell(user.user_name || "-"));
      row.appendChild(createCell(user.email || "-"));
      row.appendChild(createCell(user.sms_limit ?? "-"));
      row.appendChild(createCell(user.today_sms_count ?? "-"));
      row.appendChild(createCell(user.port ?? "-"));

      // 🔥 ACTION DROPDOWN CELL
      const actionCell = document.createElement("td");

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";

      // button (⋮ or Actions)
      const actionBtn = document.createElement("button");
      actionBtn.textContent = "⋮";
      actionBtn.className = "action-btn";

      // dropdown (hidden by default)
      const dropdown = document.createElement("ul");
      dropdown.className = "action-dropdown hidden";

      dropdown.innerHTML = `
  <li class="action-item change-password">Change Password</li>
  <li class="action-item add-sender">Add Sender Name</li>
`;

      // toggle dropdown
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        // close all others
        document.querySelectorAll(".action-dropdown").forEach(d => d.classList.add("hidden"));

        dropdown.classList.toggle("hidden");
      });

      // 🔑 Change Password click
      dropdown.querySelector(".change-password").addEventListener("click", () => {
        openChangePasswordModal(user.user_id);
      });

      // ✉️ Add Sender click
      dropdown.querySelector(".add-sender").addEventListener("click", () => {
        openSenderModal(user.user_id);
      });

      wrapper.appendChild(actionBtn);
      wrapper.appendChild(dropdown);
      actionCell.appendChild(wrapper);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  }










  let selectedUserIdForAction = null;

  function openChangePasswordModal(userId) {
    selectedUserIdForAction = userId;
    document.getElementById("password-modal").style.display = "flex";
  }

  function closePasswordModal() {
    document.getElementById("password-modal").style.display = "none";
    document.getElementById("password-form").reset();
  }

  document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;

    try {
      await apiFetch("/api/change_password", {
        method: "POST",
        json: {
          userId: selectedUserIdForAction,
          oldPassword: await hashPassword(oldPassword),
          newPassword: await hashPassword(newPassword)
        }
      });

      closePasswordModal();
      alert("Password updated successfully");

    } catch (err) {
      document.getElementById("password-error").textContent = "Failed to update password";
    }
  });




  function openSenderModal(userId) {
  selectedUserIdForAction = userId;
  document.getElementById("sender-modal").style.display = "flex";
}

function closeSenderModal() {
  document.getElementById("sender-modal").style.display = "none";
  document.getElementById("sender-form").reset();
}

document.getElementById("sender-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const senderName = document.getElementById("sender-name-input").value.trim();

  try {
    await apiFetch("/api/update_sender_name", {
      method: "POST",
      json: {
        userId: selectedUserIdForAction,
        senderName: senderName
      }
    });

    closeSenderModal();
    alert("Sender name updated");

  } catch (err) {
    document.getElementById("sender-error").textContent = "Failed to update sender name";
  }
});

  document.addEventListener("click", () => {
    document.querySelectorAll(".action-dropdown").forEach(d => d.classList.add("hidden"));
  });











  function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  }
}
