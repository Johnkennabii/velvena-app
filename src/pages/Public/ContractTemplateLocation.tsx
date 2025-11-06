export default function ContractTemplateLocation() {
  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
      <article className="space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Contrat de location de robes</h2>
        <p><strong>Entre les soussignés :</strong></p>
        <p>
          La société <strong>ALLURE CREATION</strong>, société par actions simplifiée (SAS) immatriculée au registre du commerce
          et des sociétés sous le numéro 9852878800014, ayant son siège social au 4 avenue Laurent Cély 92600 Asnières-sur-Seine,
          représentée par <strong>Madame Hassna NAFILI</strong>, en qualité de gérante, ci-après dénommée « le Prestataire ».
        </p>

        <h3 className="font-semibold mt-4">Article 1 – Objet</h3>
        <p>
          Le présent contrat a pour objet la location de tenues (robes, bijoux et accessoires) à la cliente pour la durée indiquée
          dans le contrat.
        </p>

        <h3 className="font-semibold mt-4">Article 2 – Modalités de location</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Les robes sont mises à disposition le jour convenu et doivent être restituées selon la date prévue.</li>
          <li>En cas de retard, des frais de pénalité seront appliqués (50 € par jour et par robe invitée, 100 € par jour et par robe mariée).</li>
          <li>Une caution est exigée lors de la remise des tenues.</li>
        </ul>

        <h3 className="font-semibold mt-4">Article 3 – Conditions financières</h3>
        <p>
          Un acompte de <strong>50%</strong> du montant total est dû à la signature du contrat.
          Le solde est à régler au moment du retrait des tenues.
        </p>

        <h3 className="font-semibold mt-4">Article 4 – Responsabilité</h3>
        <p>
          En cas de perte, de vol ou de détérioration, la caution pourra être retenue.
          Si les articles sont réparables, le coût de la réparation sera déduit du dépôt de garantie.
        </p>

        <h3 className="font-semibold mt-4">Article 5 – Restitution</h3>
        <p>
          Les tenues doivent être rendues propres, dans leur housse, aux heures d’ouverture du showroom.
          La non-restitution du cintre ou de la housse entraînera un prélèvement de 50 €.
        </p>

        <h3 className="font-semibold mt-4">Article 6 – Engagement</h3>
        <p>
          En validant électroniquement ce contrat, la cliente reconnaît avoir pris connaissance de toutes les dispositions
          du présent document et les accepter sans réserve.
        </p>
      </article>
    </section>
  );
}