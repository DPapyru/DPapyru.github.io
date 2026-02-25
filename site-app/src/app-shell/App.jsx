import './app-shell.css';

export default function App(props) {
    const title = props && props.title ? String(props.title) : 'Site App';
    const subtitle = props && props.subtitle ? String(props.subtitle) : 'M1 scaffold';

    return (
        <div className="site-app-shell">
            <section className="site-app-card">
                <h1 className="site-app-title">{title}</h1>
                <p className="site-app-subtitle">{subtitle}</p>
            </section>
        </div>
    );
}
