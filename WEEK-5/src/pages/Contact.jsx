function Contact() {
  return (
    <div className="page contact-page">
      <h1>Contact SoundMax</h1>

      <p className="intro">
        Have questions about our home theater systems? Get in touch with us.
      </p>

      <div className="contact-container">
        <form className="contact-form">
          <input type="text" placeholder="Enter your name" />

          <input type="email" placeholder="Enter your email" />

          <input type="text" placeholder="Subject" />

          <textarea
            rows="6"
            placeholder="Write your message"
          ></textarea>

          <button type="submit">Send Message</button>
        </form>

        <div className="contact-info">
          <h2>Contact Information</h2>

          <p>
            <strong>Company:</strong> SoundMax Home Theater
          </p>

          <p>
            <strong>Email:</strong> support@soundmax.com
          </p>

          <p>
            <strong>Phone:</strong> +91 98765 43210
          </p>

          <p>
            <strong>Working Hours:</strong> Monday - Saturday
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;