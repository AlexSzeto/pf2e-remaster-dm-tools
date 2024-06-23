/** @jsx h */
import { render, Component } from 'preact';
import { html } from "htm/preact";


class DisplayStudent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      student: null
    };
  }

  componentDidMount() {
    this.loadStudentData();
    this.interval = setInterval(this.loadStudentData, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadStudentData = () => {
    const studentData = this.getCookie('studentData');
    if (studentData) {
      this.setState({ student: JSON.parse(studentData) });
    }
  };

  getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  render() {
    const { student } = this.state;
    return html`
      <div>
        ${student ? html`
          <div>
            <h1>Student Data</h1>
            <p><strong>First Name:</strong> ${student.firstName}</p>
            <p><strong>Last Name:</strong> ${student.lastName}</p>
            <p><strong>ID Number:</strong> ${student.idNumber}</p>
            <p><strong>Classes:</strong></p>
            <ul>
              ${student.classes.map((cls, index) => html`<li key=${index}>${cls}</li>`)}
            </ul>
          </div>
        ` : html`<p>No student data found.</p>`}
      </div>
    `;
  }
}

render(html`<${DisplayStudent} />`, document.getElementById('root'));
