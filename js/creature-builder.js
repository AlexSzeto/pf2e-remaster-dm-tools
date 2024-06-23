import { render, Component } from 'preact';
import { html } from "htm/preact";

class StudentForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      idNumber: '',
      classes: ['']
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleClassChange = (index, e) => {
    const { value } = e.target;
    const classes = [...this.state.classes];
    classes[index] = value;
    this.setState({ classes });
  };

  addClassField = () => {
    this.setState({ classes: [...this.state.classes, ''] });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const student = {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      idNumber: this.state.idNumber,
      classes: this.state.classes
    };
    this.setCookie('studentData', JSON.stringify(student), 7);
    console.log('Student data saved to cookie:', student);
  };

  setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  };

  render() {
    return html`
      <form onSubmit=${this.handleSubmit}>
        <div>
          <label>
            First Name:
            <input
              type="text"
              name="firstName"
              value=${this.state.firstName}
              onInput=${this.handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Last Name:
            <input
              type="text"
              name="lastName"
              value=${this.state.lastName}
              onInput=${this.handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            ID Number:
            <input
              type="text"
              name="idNumber"
              value=${this.state.idNumber}
              onInput=${this.handleChange}
            />
          </label>
        </div>
        <div>
          <label>Classes:</label>
          ${this.state.classes.map((cls, index) => html`
            <div key=${index}>
              <input
                type="text"
                value=${cls}
                onInput=${(e) => this.handleClassChange(index, e)}
              />
            </div>
          `)}
          <button type="button" onClick=${this.addClassField}>Add Class</button>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;
  }
}

render(html`<${StudentForm} />`, document.body);
