import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import VideoConvert from '../components/VideoConvert';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Video Convert Tutorial</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
       <VideoConvert/>
      </IonContent>
    </IonPage>
  );
};

export default Home;
