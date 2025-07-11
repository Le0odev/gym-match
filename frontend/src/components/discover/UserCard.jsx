import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Heart, X, MapPin, Target, Ruler, Weight } from 'lucide-react';

const UserCard = ({ user, onLike, onSkip, loading }) => {
  const handleLike = () => {
    onLike(user.id);
  };

  const handleSkip = () => {
    onSkip(user.id);
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        {/* User Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h3>
          {user.compatibilityScore && (
            <div className="flex items-center justify-center mb-2">
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                {user.compatibilityScore}% compatível
              </div>
            </div>
          )}
        </div>

        {/* Physical Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {user.height && (
            <div className="flex items-center text-sm text-gray-600">
              <Ruler className="h-4 w-4 mr-2" />
              <span>{user.height} cm</span>
            </div>
          )}
          {user.weight && (
            <div className="flex items-center text-sm text-gray-600">
              <Weight className="h-4 w-4 mr-2" />
              <span>{user.weight} kg</span>
            </div>
          )}
        </div>

        {/* Goal */}
        {user.goal && (
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Target className="h-4 w-4 mr-2" />
              <span className="font-medium">Objetivo:</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{user.goal}</p>
          </div>
        )}

        {/* Workout Preferences */}
        {user.workoutPreferences && user.workoutPreferences.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Treinos favoritos:</p>
            <div className="flex flex-wrap gap-1">
              {user.workoutPreferences.slice(0, 3).map((pref) => (
                <Badge key={pref.id} variant="secondary" className="text-xs">
                  {pref.name}
                </Badge>
              ))}
              {user.workoutPreferences.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.workoutPreferences.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Gym */}
        {user.gym && (
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{user.gym.name}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleSkip}
            disabled={loading}
          >
            <X className="h-5 w-5 mr-2" />
            Pular
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleLike}
            disabled={loading}
          >
            <Heart className="h-5 w-5 mr-2" />
            Curtir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;

