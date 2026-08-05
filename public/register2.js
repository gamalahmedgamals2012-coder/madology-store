const loginBtn = document.querySelector(".log");
        loginBtn.addEventListener("click", () => {
            const email = document.querySelector("#username").value.trim();
            const password = document.querySelector("#password").value.trim();

            if (!email || !password) {
                alert("Please fill in all fields!");
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
                        alert("Login successful!");
                        window.location.href = "index.html";
                    } else {
                        alert(data.message);
                    }
                })
                .catch(err => console.error(err));
        });
