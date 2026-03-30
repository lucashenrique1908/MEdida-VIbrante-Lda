const promoCards = document.querySelectorAll(".promo-card");

promoCards.forEach((card) => {
  const features = card.querySelectorAll(".feature");

  if (!features.length) {
    return;
  }

  let index = 0;

  features.forEach((feature, featureIndex) => {
    feature.classList.toggle("active", featureIndex === 0);
  });

  setInterval(() => {
    features[index].classList.remove("active");

    index = (index + 1) % features.length;

    features[index].classList.add("active");
  }, 2000);
});
