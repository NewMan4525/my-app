import styles from "./link.module.css";

interface LinkProps {
  href: string;
  text: string;
}

export default function Link({ href, text }: LinkProps) {
  return (
    <div className={styles.link_wrapper}>
      <a href={href}>{text}</a>
    </div>
  );
}
