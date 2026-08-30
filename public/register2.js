const loginBtn = document.querySelector(".log");
        loginBtn?.addEventListener("click", () => {
            const email = document.querySelector("#username").value.trim();
            const password = document.querySelector("#password").value.trim();

            if (!email || !password) {
                window.MADOLOGY_SHOW_TOAST?.("Please fill in all fields!", "error");
                return;
            }

            const apiBaseUrl =
              window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

            fetch(`${apiBaseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.token) {
                        localStorage.setItem("token", data.token);
                        if (data.user?.name || data.name) {
                            localStorage.setItem("userName", data.user?.name || data.name);
                        }
                        window.MADOLOGY_SHOW_TOAST?.("Login successful!", "success");
                        window.location.href = "index.html";
                    } else {
                        window.MADOLOGY_SHOW_TOAST?.(data.message || "Login failed.", "error");
                    }
                })
                .catch(err => console.error(err));
        });
