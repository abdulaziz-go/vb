particlesJS("particles-js", {
  particles: {
    number: {
      value: 70,
      density: { enable: true, value_area: 900 }
    },
    color: {
      value: "#ffffff"
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.55,
      random: false
    },
    size: {
      value: 3,
      random: true
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#ffffff",
      opacity: 0.35,
      width: 1
    },
    move: {
      enable: true,
      speed: 1.2
    }
  },
  interactivity: {
    events: {
      onhover: { enable: true, mode: "grab" }
    },
    modes: {
      grab: {
        distance: 180,
        line_linked: { opacity: 0.6 }
      }
    }
  },
  retina_detect: true
});
