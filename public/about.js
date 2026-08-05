const scrollTopButton = document.querySelector(".scroll-top-button");

function updateScrollTopButton() {
  scrollTopButton.style.display = scrollY > 200 ? "block" : "none";
}

scrollTopButton.addEventListener("click", () => {
  if (scrollY >= 200) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

window.addEventListener("scroll", updateScrollTopButton);
