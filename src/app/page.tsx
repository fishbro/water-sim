import Image from "next/image";
import styles from "./page.module.css";
import WaterScene from "modules/water/WaterScene";

export default function Home() {
    return (
        <main className={styles.main}>
            <WaterScene />
        </main>
    );
}
