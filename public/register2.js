const loginBtn = document.querySelector(".log");
        loginBtn?.addEventListener("click", () => {
            const email = document.querySelector("#username").value.trim();
            const password = document.querySelector("#password").value.trim();

            if (!email || !password) {
                window.MADOLOGY_SHOW_TOAST?.("Please fill in all fields!", "error");
                return;
            }

            fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.userId) {
                        localStorage.setItem("userId", data.userId);
                        window.MADOLOGY_SHOW_TOAST?.("Login successful!", "success");
                        window.location.href = "index.html";
                    } else {
                        window.MADOLOGY_SHOW_TOAST?.(data.message || "Login failed.", "error");
                    }
                })
                .catch(err => console.error(err));
        });
