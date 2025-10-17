import React from "react";
import {
  MapPin,
  Phone,
  Globe,
  Lightbulb,
  Car,
  Accessibility,
  Star,
  X,
} from "lucide-react";
import { Field } from "../api/fields";
import { getFieldIcon } from "../utils";

interface FieldCardProps {
  field: Field;
  onClose: () => void;
}

const FieldCard: React.FC<FieldCardProps> = ({ field, onClose }) => {
  console.log("FieldCard props:", field);
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100/50 p-6 max-w-md mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">{getFieldIcon(field.surface_type || "")}</span>
          </div>
          <h3 className="text-xl font-bold text-emerald-800">{field.name}</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-emerald-50/50"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mb-5">
        <img
          src={field.photos?.[0] || "Images/placeholder.jpeg"}
          alt={field.name}
          className="w-full h-48 object-cover rounded-xl border border-emerald-100/50"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-emerald-700 font-medium">
            {field.address}
          </span>
        </div>

        {field.rating && (
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-emerald-700 font-medium">
              {field.rating} ({field.reviews ?? 0} reviews)
            </span>
          </div>
        )}

        {field.description && (
          <p className="text-sm text-emerald-600/80 leading-relaxed">
            {field.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-emerald-50/50 p-3 rounded-xl">
            <span className="font-semibold text-emerald-700 block">Surface</span>
            <span className="text-emerald-600">{field.surface_type || "—"}</span>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-xl">
            <span className="font-semibold text-emerald-700 block">Format</span>
            <span className="text-emerald-600">{field.format || "—"}</span>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-xl">
            <span className="font-semibold text-emerald-700 block">Quartier/Ville</span>
            <span className="text-emerald-600">{field.borough || "—"}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {field.lighting && (
            <span className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
              <Lightbulb className="h-3 w-3 mr-1.5" />
              Éclairage
            </span>
          )}
          {field.parking && (
            <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              <Car className="h-3 w-3 mr-1.5" />
              Stationnement
            </span>
          )}
          {field.accessibility && (
            <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
              <Accessibility className="h-3 w-3 mr-1.5" />
              Accessible
            </span>
          )}
        </div>

        {Array.isArray(field.amenities) && field.amenities.length > 0 && (
          <div>
            <span className="font-semibold text-emerald-700 text-sm block mb-2">
              Commodités
            </span>
            <div className="flex flex-wrap gap-1.5">
              {field.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-block px-2.5 py-1 bg-emerald-100/70 text-emerald-700 text-xs rounded-full font-medium"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-emerald-100/50 space-y-2">
          {field.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-emerald-500" />
              <a
                href={`tel:${field.phone}`}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                {field.phone}
              </a>
            </div>
          )}
          {field.website && (
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <a
                href={field.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Site Web
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldCard;
