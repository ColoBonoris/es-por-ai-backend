import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import {
  PLACE_REPOSITORY,
  PLACE_SUBMISSION_REPOSITORY,
  type PlaceRepository,
  type PlaceSubmissionListQuery,
  type PlaceSubmissionRepository
} from "@/domain/places/place.repository";
import type { Coordinates } from "@/domain/places/place.entity";

@Injectable()
export class AdminPlaceSubmissionsService {
  constructor(
    @Inject(PLACE_SUBMISSION_REPOSITORY)
    private readonly placeSubmissions: PlaceSubmissionRepository,
    @Inject(PLACE_REPOSITORY)
    private readonly places: PlaceRepository
  ) {}

  listPending(query: PlaceSubmissionListQuery) {
    return this.placeSubmissions.listPendingAdmin(query);
  }

  async approve(id: string, coordinates?: Coordinates) {
    const submission = await this.placeSubmissions.findById(id);

    if (!submission) {
      throw new NotFoundException("Solicitud no encontrada.");
    }

    if (submission.status !== "pending") {
      throw new ConflictException("La solicitud ya fue revisada.");
    }

    const nextCoordinates = coordinates ?? submission.coordinates;

    if (!nextCoordinates) {
      throw new BadRequestException("Seleccioná la ubicación del lugar.");
    }

    const place = await this.places.createApproved({
      id: submission.id,
      name: submission.name,
      address: submission.address,
      category: submission.category,
      description: submission.description,
      coordinates: nextCoordinates,
      badges: submission.badges,
      images: submission.images
    });
    const updatedSubmission = await this.placeSubmissions.markApproved(id);

    return {
      place,
      submission: updatedSubmission ?? submission
    };
  }

  async reject(id: string) {
    const submission = await this.placeSubmissions.findById(id);

    if (!submission) {
      throw new NotFoundException("Solicitud no encontrada.");
    }

    if (submission.status !== "pending") {
      throw new ConflictException("La solicitud ya fue revisada.");
    }

    return {
      submission: await this.placeSubmissions.markRejected(id)
    };
  }
}
