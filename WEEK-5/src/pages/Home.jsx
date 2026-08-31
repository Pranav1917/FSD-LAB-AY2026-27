function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <p className="tagline">PREMIUM HOME THEATER AUDIO</p>

          <h1>
            Feel Every Sound.
            <br />
            Experience Every Moment.
          </h1>

          <p>
            SoundMax brings cinematic sound directly into your home with
            powerful speakers designed for an immersive entertainment
            experience.
          </p>

          <button>Explore Speakers</button>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose SoundMax?</h2>

        <div className="feature-container">
          <div className="feature-card">
            <h3>Powerful Bass</h3>
            <p>
              Deep and powerful bass that makes movies, music and games feel
              more realistic.
            </p>
          </div>

          <div className="feature-card">
            <h3>Surround Sound</h3>
            <p>
              Experience immersive audio that surrounds you from every
              direction.
            </p>
          </div>

          <div className="feature-card">
            <h3>Premium Design</h3>
            <p>
              Modern speaker designs built to perfectly match your home
              entertainment setup.
            </p>
          </div>
        </div>
      </section>

      <section className="products">
        <h2>Our Home Theater Experience</h2>

        <div className="product-container">
          <div className="product-card">
            <h3>SoundMax X500</h3>
            <p>5.1 Channel Surround Sound</p>
            <p>Perfect for movies and gaming.</p>
          </div>

          <div className="product-card">
            <h3>SoundMax X700</h3>
            <p>7.1 Channel Premium Audio</p>
            <p>Designed for a complete cinematic experience.</p>
          </div>

          <div className="product-card">
            <h3>SoundMax Cinema Pro</h3>
            <p>Professional Home Theater System</p>
            <p>Powerful sound for serious entertainment lovers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;