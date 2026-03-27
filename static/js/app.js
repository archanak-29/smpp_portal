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

  const response = await fetch(path, { ...options, headers });

  try {
    const clone = response.clone();
    const data = await clone.json();
    const method = options.method || 'GET';

    const apiStatus = data.status || "";
    if (apiStatus === "Session expired" || apiStatus === "Invalid session") {
      showOperationStatus(apiStatus, "error");
      setTimeout(() => {
        localStorage.removeItem("session_id");
        localStorage.removeItem("is_admin");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        window.location.href = "/";
      }, 2000);
      return response;
    }

    if (method === 'POST' || method === 'PUT') {
      if (response.ok && data.status === "success") {
        showOperationStatus(data.status, "success");
      } else {
        showOperationStatus(data.status || "Failed", "error");
      }
    } else if (method === 'GET') {
      if (!response.ok || data.status !== "success") {
        showOperationStatus(data.status || "Failed to load", "error");
      }
    }
  } catch (e) { }

  return response;
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

function showOperationStatus(message, status) {
  const toast = document.getElementById("operation-status-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "inline-block";
  toast.style.opacity = "1";

  if (status === "success") {
    toast.style.backgroundColor = "#4caf50";
    toast.style.color = "white";
  } else {
    toast.style.backgroundColor = "#f44336";
    toast.style.color = "white";
  }

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.style.opacity === "0") {
        toast.style.display = "none";
      }
    }, 300);
  }, 3000);
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
  const pageSize = 10;
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
        portUsername: document.getElementById("port-user-name").value.trim(),
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

      const userCell = document.createElement("td");
      const nameSpan = document.createElement("span");
      nameSpan.textContent = user.user_name || "-";
      nameSpan.className = "clickable-username";
      nameSpan.addEventListener("click", () => {
        openViewSendersModal(user.user_id);
      });
      userCell.appendChild(nameSpan);
      row.appendChild(userCell);

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

      // 🔥 OPERATIONS CELL (Admin Only)
      const isAdmin = localStorage.getItem("is_admin") === "true";
      if (isAdmin) {
        const actionCell = document.createElement("td");
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";

        const actionBtn = document.createElement("button");
        actionBtn.textContent = "⋮";
        actionBtn.className = "action-btn";

        const dropdown = document.createElement("ul");
        dropdown.className = "action-dropdown hidden";
        dropdown.innerHTML = `
          <li class="action-item add-sender">Add Sender Name</li>
        `;

        actionBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".action-dropdown").forEach(d => d.classList.add("hidden"));
          dropdown.classList.toggle("hidden");
        });

        dropdown.querySelector(".add-sender").addEventListener("click", () => {
          openSenderModal(user.user_id);
        });

        wrapper.appendChild(actionBtn);
        wrapper.appendChild(dropdown);
        actionCell.appendChild(wrapper);
        row.appendChild(actionCell);
      }

      // 🔥 DELETE CELL
      const deleteCell = document.createElement("td");

      const deleteBtn = document.createElement("button");
      deleteBtn.title = "Delete User";
      deleteBtn.style.backgroundColor = "#243340"; // Dark blue/gray matching the image
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "2px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.width = "36px";
      deleteBtn.style.height = "36px";
      deleteBtn.style.display = "flex";
      deleteBtn.style.alignItems = "center";
      deleteBtn.style.justifyContent = "center";

      // White SVG trash icon
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

      deleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        selectedUserId = user.user_id;
        openDeleteModal();
      });

      deleteCell.appendChild(deleteBtn);
      row.appendChild(deleteCell);

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
    el.addEventListener("click", (e) => {
      const modal = el.closest('.modal');
      if (modal && modal.id === "status-modal") {
        closeStatusModal();
      } else if (modal && modal.id === "delete-modal") {
        closeDeleteModal();
      } else if (modal && modal.id === "sender-modal") {
        closeSenderModal();
      } else if (modal && modal.id === "view-senders-modal") {
        closeViewSendersModal();
      } else if (modal && modal.id === "delete-sender-confirm-modal") {
        closeDeleteSenderConfirmModal();
      } else {
        closeStatusModal();
        closeDeleteModal();
        if (typeof closeSenderModal === "function") closeSenderModal();
        if (typeof closeViewSendersModal === "function") closeViewSendersModal();
        if (typeof closeDeleteSenderConfirmModal === "function") closeDeleteSenderConfirmModal();
        if (typeof closeModal === "function") closeModal();
      }
    });
  });

  // =========================
  // VIEW SENDERS MODAL LOGIC
  // =========================
  async function openViewSendersModal(userId) {
    const modal = document.getElementById("view-senders-modal");
    const errorEl = document.getElementById("view-senders-error");
    const tableBody = document.getElementById("view-senders-table-body");

    if (errorEl) errorEl.textContent = "Loading...";
    if (tableBody) tableBody.innerHTML = "";
    if (modal) modal.style.display = "flex";

    try {
      const resp = await apiFetch(`/api/all_sender_identifiers/${userId}`);
      const data = await resp.json();

      if (resp.ok && data.status === "success") {
        if (errorEl) errorEl.textContent = "";
        const identifiers = data.senderIdentifiers || [];

        if (identifiers.length === 0) {
          tableBody.innerHTML = "<tr><td class='table-muted' colspan='2'>No sender names found.</td></tr>";
        } else {
          identifiers.forEach(ident => {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.textContent = ident.identifier_name;

            const actionTd = document.createElement("td");
            actionTd.style.textAlign = "center";
            const deleteBtn = document.createElement("button");
            deleteBtn.title = "Delete Sender Name";
            deleteBtn.style.backgroundColor = "#243340";
            deleteBtn.style.border = "none";
            deleteBtn.style.borderRadius = "4px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.width = "30px";
            deleteBtn.style.height = "30px";
            deleteBtn.style.display = "flex";
            deleteBtn.style.alignItems = "center";
            deleteBtn.style.justifyContent = "center";
            deleteBtn.style.margin = "0 auto";

            deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

            deleteBtn.addEventListener("click", () => {

              selectedSenderNameForDeletion = ident.identifier_name;
              selectedUserIdForSenderDeletion = userId;
              openDeleteSenderConfirmModal();
            });
            actionTd.appendChild(deleteBtn);

            tr.appendChild(td);
            tr.appendChild(actionTd);
            tableBody.appendChild(tr);
          });
        }
      } else {
        if (errorEl) errorEl.textContent = data.status || "Failed to load sender names.";
        tableBody.innerHTML = "<tr><td class='table-muted' colspan='2'>Error loading data.</td></tr>";
      }
    } catch (err) {
      if (errorEl) errorEl.textContent = "Server error while fetching sender names.";
      tableBody.innerHTML = "<tr><td class='table-muted' colspan='2'>Error loading data.</td></tr>";
    }
  }

  function closeViewSendersModal() {
    const modal = document.getElementById("view-senders-modal");
    if (modal) modal.style.display = "none";
    const tableBody = document.getElementById("view-senders-table-body");
    if (tableBody) tableBody.innerHTML = "";
    const errorEl = document.getElementById("view-senders-error");
    if (errorEl) errorEl.textContent = "";
  }

  const viewSendersModalCloseElements = [
    document.getElementById("close-view-senders-btn"),
    document.getElementById("cancel-view-senders-btn"),
    document.getElementById("view-senders-modal-backdrop")
  ];
  viewSendersModalCloseElements.forEach(el => {
    if (el) el.addEventListener("click", closeViewSendersModal);
  });

  // =========================
  // DELETE SENDER MODAL
  // =========================
  let selectedSenderNameForDeletion = null;
  let selectedUserIdForSenderDeletion = null;

  function openDeleteSenderConfirmModal() {
    const modal = document.getElementById("delete-sender-confirm-modal");
    if (modal) modal.style.display = "flex";
    const errorEl = document.getElementById("delete-sender-error");
    if (errorEl) errorEl.textContent = "";
  }

  function closeDeleteSenderConfirmModal() {
    const modal = document.getElementById("delete-sender-confirm-modal");
    if (modal) modal.style.display = "none";
    const errorEl = document.getElementById("delete-sender-error");
    if (errorEl) errorEl.textContent = "";
  }

  const deleteSenderCloseEls = [
    document.getElementById("close-delete-sender-btn"),
    document.getElementById("cancel-delete-sender-btn"),
    document.getElementById("delete-sender-backdrop")
  ];
  deleteSenderCloseEls.forEach(el => {
    if (el) el.addEventListener("click", closeDeleteSenderConfirmModal);
  });

  const confirmDeleteSenderBtn = document.getElementById("confirm-delete-sender-btn");
  if (confirmDeleteSenderBtn) {
    confirmDeleteSenderBtn.addEventListener("click", async () => {
      const errorEl = document.getElementById("delete-sender-error");
      if (errorEl) errorEl.textContent = "Deleting...";

      try {
        const delResp = await apiFetch(`/api/delete_sender_id/${encodeURIComponent(selectedSenderNameForDeletion)}`, {
          method: "DELETE"
        });
        const delData = await delResp.json();
        if (delResp.ok && delData.status === "success") {
          closeDeleteSenderConfirmModal();
          openViewSendersModal(selectedUserIdForSenderDeletion);
        } else {
          if (errorEl) errorEl.textContent = delData.status || "Failed to delete sender name.";
        }
      } catch (e) {
        if (errorEl) errorEl.textContent = "Server error while deleting sender name.";
      }
    });
  }

  // =========================
  // SENDER MODAL LOGIC
  // =========================
  let selectedUserIdForAction = null;

  function openSenderModal(userId) {
    selectedUserIdForAction = userId;
    const modal = document.getElementById("sender-modal");
    if (modal) modal.style.display = "flex";
  }

  function closeSenderModal() {
    const modal = document.getElementById("sender-modal");
    if (modal) modal.style.display = "none";
    const form = document.getElementById("sender-form");
    if (form) form.reset();
    const errorEl = document.getElementById("sender-error");
    if (errorEl) errorEl.textContent = "";
  }

  const senderModalCloseElements = [
    document.getElementById("close-sender-btn"),
    document.getElementById("cancel-sender-btn"),
    document.getElementById("sender-modal-backdrop")
  ];
  senderModalCloseElements.forEach(el => {
    if (el) el.addEventListener("click", closeSenderModal);
  });

  const senderForm = document.getElementById("sender-form");
  if (senderForm) {
    senderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const senderName = document.getElementById("sender-name-input").value.trim();
      const errorEl = document.getElementById("sender-error");
      if (errorEl) errorEl.textContent = "";

      try {
        const response = await apiFetch("/api/add_sender_id", {
          method: "POST",
          json: {
            userId: selectedUserIdForAction,
            senderId: senderName
          }
        });
        const data = await response.json();

        if (response.ok && data.status === "success") {
          closeSenderModal();
        } else {
          if (errorEl) errorEl.textContent = data.status || "Failed to update sender name";
        }
      } catch (err) {
        if (errorEl) errorEl.textContent = "Failed to update sender name";
      }
    });
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".action-dropdown").forEach(d => d.classList.add("hidden"));
  });

  // =========================
  // DELETE USER LOGIC
  // =========================
  function openDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.style.display = "flex";
  }

  function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.style.display = "none";
    const form = document.getElementById("delete-form");
    if (form) form.reset();
    const errorEl = document.getElementById("delete-error");
    if (errorEl) errorEl.textContent = "";
  }

  const deleteForm = document.getElementById("delete-form");
  if (deleteForm) {
    deleteForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const reason = document.getElementById("delete-reason").value.trim();
      const errorEl = document.getElementById("delete-error");

      if (!reason) {
        errorEl.textContent = "Reason is required";
        return;
      }

      try {
        const response = await apiFetch(`/api/delete_user/${selectedUserId}/${encodeURIComponent(reason)}`, {
          method: "PUT"
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
          throw new Error(data.status || "Failed to delete user");
        }

        closeDeleteModal();
        loadUsers();
      } catch (err) {
        errorEl.textContent = err.message || "Failed to delete user";
      }
    });
  }

  const cancelDeleteBtn = document.getElementById("cancel-delete");
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  }

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
  if (page === "ports") initPortsPage();
  if (page === "send_sms") initSendSmsPage();

  initGlobalProfile();
});

function initSendSmsPage() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  async function fetchSenderIds() {
    try {
      const resp = await apiFetch(`/api/all_sender_identifiers/${userId}`);
      const data = await resp.json();

      if (resp.ok && data.status === "success") {
        const identifiers = data.senderIdentifiers || [];
        populateSelect(document.getElementById("sms-sender-id"), identifiers);
        populateSelect(document.getElementById("bulk-sms-sender-id"), identifiers);
      }
    } catch (err) {
      console.error("Failed to load sender IDs", err);
    }
  }

  function populateSelect(selectEl, identifiers) {
    if (!selectEl) return;
    // clear existing options except the placeholder
    selectEl.innerHTML = '<option value="" disabled selected>Select Sender ID...</option>';

    identifiers.forEach(ident => {
      const opt = document.createElement("option");
      opt.value = ident.identifier_name;
      opt.textContent = ident.identifier_name;
      selectEl.appendChild(opt);
    });
  }

  fetchSenderIds();

  // Handle single SMS Form
  const singleForm = document.getElementById("single-sms-form");
  const singleError = document.getElementById("single-sms-error");

  if (singleForm) {
    singleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (singleError) singleError.textContent = "";

      const senderId = document.getElementById("sms-sender-id").value;
      const msisdn = document.getElementById("sms-msisdn").value.trim();
      const message = document.getElementById("sms-message").value.trim();

      if (!senderId) {
        if (singleError) singleError.textContent = "Please select a Sender ID.";
        return;
      }

      try {
        const resp = await apiFetch("/api/send_a2p_sms", {
          method: "POST",
          json: {
            senderId: senderId,
            msisdn: msisdn,
            short_message: message
          }
        });
        const data = await resp.json();

        if (resp.ok && data.status === "success" || data.status === true) {
          singleForm.reset();
        } else {
          if (singleError) singleError.textContent = data.status || "Failed to send SMS";
        }
      } catch (err) {
        if (singleError) singleError.textContent = "Server error occurred while sending SMS.";
      }
    });
  }

  // Handle bulk SMS File Selection
  const bulkFileZone = document.getElementById("bulk-upload-zone");
  const bulkFileInput = document.getElementById("bulk-sms-file");
  const bulkFileName = document.getElementById("bulk-file-name");

  if (bulkFileZone && bulkFileInput) {
    bulkFileZone.addEventListener("click", () => bulkFileInput.click());

    bulkFileZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      bulkFileZone.style.borderColor = "var(--primary)";
    });

    bulkFileZone.addEventListener("dragleave", () => {
      bulkFileZone.style.borderColor = "var(--border)";
    });

    bulkFileZone.addEventListener("drop", (e) => {
      e.preventDefault();
      bulkFileZone.style.borderColor = "var(--border)";
      if (e.dataTransfer.files.length) {
        bulkFileInput.files = e.dataTransfer.files;
        if (bulkFileName) bulkFileName.textContent = e.dataTransfer.files[0].name;
      }
    });

    bulkFileInput.addEventListener("change", () => {
      if (bulkFileInput.files.length > 0) {
        if (bulkFileName) bulkFileName.textContent = bulkFileInput.files[0].name;
      } else {
        if (bulkFileName) bulkFileName.textContent = "Max file size: 5MB";
      }
    });
  }

  // Handle bulk SMS Form
  const bulkForm = document.getElementById("bulk-sms-form");
  const bulkError = document.getElementById("bulk-sms-error");

  if (bulkForm) {
    bulkForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (bulkError) bulkError.textContent = "";

      const senderId = document.getElementById("bulk-sms-sender-id").value;
      const message = document.getElementById("bulk-sms-message").value.trim();
      const fileInput = document.getElementById("bulk-sms-file");

      if (!senderId) {
        if (bulkError) bulkError.textContent = "Please select a Sender ID.";
        return;
      }

      if (!fileInput.files || fileInput.files.length === 0) {
        if (bulkError) bulkError.textContent = "Please select a CSV file.";
        return;
      }

      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          // Split by newline and filter empty lines
          const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

          if (lines.length === 0) {
            if (bulkError) bulkError.textContent = "CSV file is empty.";
            return;
          }

          const headerRow = lines[0].split(',')[0].trim();
          if (headerRow !== "Receivers") {
            if (bulkError) bulkError.textContent = "Invalid CSV format. Header 'Receivers' is missing.";
            return;
          }

          const receivers = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            const number = parts[0].trim();
            if (!/^\d+$/.test(number)) {
              if (bulkError) bulkError.textContent = `Invalid format at row ${i + 1}. Expected a valid number. File should contain only digits under 'Receivers'.`;
              return;
            }
            receivers.push(number);
          }

          if (receivers.length === 0) {
            if (bulkError) bulkError.textContent = "No valid numbers found in the CSV.";
            return;
          }

          const resp = await apiFetch("/api/send_bulk_sms/", {
            method: "POST",
            json: {
              senderId: senderId,
              receivers: receivers,
              short_message: message
            }
          });

          const data = await resp.json();
          if (resp.ok && (data.status === "success" || data.status === true)) {
            bulkForm.reset();
            if (bulkFileName) bulkFileName.textContent = "Max file size: 5MB";
            if (bulkError) {
              bulkError.style.color = "green";
              bulkError.textContent = `Successfully scheduled ${receivers.length} messages.`;
              setTimeout(() => { bulkError.textContent = ""; bulkError.style.color = ""; }, 3000);
            }
          } else {
            if (bulkError) bulkError.textContent = data.status || "Failed to send bulk SMS";
          }
        } catch (err) {
          if (bulkError) bulkError.textContent = "Error processing CSV or sending SMS.";
        }
      };

      reader.onerror = () => {
        if (bulkError) bulkError.textContent = "Failed to read file.";
      };

      reader.readAsText(file);
    });
  }
}

function initGlobalProfile() {
  const profileTrigger = document.getElementById("profile-menu-trigger");
  if (profileTrigger) {
    profileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".action-dropdown").forEach(d => {
        if (d.id !== "profile-dropdown") d.classList.add("hidden");
      });
      const dropdown = document.getElementById("profile-dropdown");
      if (dropdown) dropdown.classList.toggle("hidden");
    });
  }

  const btn = document.getElementById("global-change-password-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const modal = document.getElementById("password-modal");
      if (modal) modal.style.display = "flex";
    });
  }

  const closePasswordModal = () => {
    const modal = document.getElementById("password-modal");
    if (modal) {
      modal.style.display = "none";
      const form = document.getElementById("password-form");
      if (form) form.reset();
      const err = document.getElementById("password-error");
      if (err) err.textContent = "";
    }
  };

  const form = document.getElementById("password-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const oldPassword = document.getElementById("old-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const errorEl = document.getElementById("password-error");

      if (newPassword !== confirmPassword) {
        errorEl.textContent = "New password and confirm password do not match.";
        return;
      }
      errorEl.textContent = "";

      try {
        const response = await apiFetch("/api/change_password", {
          method: "PUT",
          json: {
            username: localStorage.getItem('username'),
            password: await hashPassword(oldPassword),
            newPassword: await hashPassword(newPassword),
            actualPassword: newPassword
          }
        });
        const data = await response.json();

        if (response.ok && data.status === "success") {
          closePasswordModal();
        }
      } catch (err) {
        errorEl.textContent = "Failed to update password";
      }
    });

    const closers = [
      document.getElementById("close-password-btn"),
      document.getElementById("cancel-password-btn"),
      document.getElementById("password-modal-backdrop")
    ];
    closers.forEach(el => {
      if (el) el.addEventListener("click", closePasswordModal);
    });
  }
}

function initPortsPage() {
  const openModalBtn = document.getElementById("open-add-port-modal");
  const modal = document.getElementById("add-port-modal");
  const form = document.getElementById("add-port-form");
  const formError = document.getElementById("add-port-error");

  const closeModal = () => {
    if (modal) modal.style.display = "none";
    if (form) form.reset();
    if (formError) formError.textContent = "";
  };

  if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "flex";
    });
  }

  const closers = [
    document.getElementById("close-add-port-btn"),
    document.getElementById("cancel-add-port-btn"),
    document.getElementById("add-port-backdrop")
  ];
  closers.forEach(el => {
    if (el) el.addEventListener("click", closeModal);
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formError) formError.textContent = "";

      const username = document.getElementById("new-port-username").value.trim();
      const password = document.getElementById("new-port-password").value;
      const portNumber = document.getElementById("new-port-number").value;
      const smsRead = document.getElementById("new-port-sms-read").checked;

      if (password.length >= 9) {
        if (formError) formError.textContent = "Password must be less than 9 characters.";
        return;
      }

      const payload = {
        username: username,
        password: password,
        port: Number(portNumber),
        isReadOnlySms: smsRead
      };

      try {
        const response = await apiFetch("/api/add_smpp_user", {
          method: "POST",
          json: payload
        });
        const data = await response.json();

        if (response.ok && data.status === "success" || data.status === true) {
          closeModal();
          loadPorts();
        } else {
          if (formError) formError.textContent = data.status || "Failed to add port.";
        }
      } catch (err) {
        if (formError) formError.textContent = "Server error while adding port.";
      }
    });
  }

  loadPorts();
}

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
  let selectedPort = null;

  ports.forEach(p => {
    const row = `
            <tr>
                <td>${p.port}</td>
                <td>${p.system_id}</td>
                <td>${p.password}</td>
                <td>${p.is_read_only_sms ? "Sms reading" : "Sms delivering"}</td>

                <td>
                  <button class="delete-btn" id="port-button" data-port="${p.system_id}"><svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                </td>
            </tr>
        `;
    tableBody.innerHTML += row;
  });


  tableBody.addEventListener("click", function (e) {
    const btn = e.target.closest(".delete-btn");
    if (btn) {
      const port = btn.getAttribute("data-port");
      selectedPort = port
      console.log(port);
      openDeleteModal(port);

    }
  });

  function openDeleteModal(port) {
    const modal = document.getElementById("delete-port-modal");
    if (modal) modal.style.display = "flex";
  }



  function closeDeleteModal() {
    const modal = document.getElementById("delete-port-modal");
    if (modal) modal.style.display = "none";
    const form = document.getElementById("delete-port-form");
    if (form) form.reset();
    const errorEl = document.getElementById("delete-error");
    if (errorEl) errorEl.textContent = "";
  }

  const deleteForm = document.getElementById("delete-port-form");
  if (deleteForm) {
    deleteForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const errorEl = document.getElementById("delete-error");


      try {
        const response = await apiFetch(`/api/delete_smpp_user/${selectedPort}`, {
          method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
          throw new Error(data.status || "Failed to delete user");
        }

        closeDeleteModal();
        loadPorts();
      } catch (err) {
        errorEl.textContent = err.message || "Failed to delete user";
      }
    });
  }

  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const cancelDeleteBtnx = document.getElementById("cancel-delete-x");

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  }

  if (cancelDeleteBtnx) {
    cancelDeleteBtnx.addEventListener("click", closeDeleteModal);
  }


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

      tableBody.appendChild(row);
    });
  }

  function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  }
}
